#!/usr/bin/env node
import { createInterface } from 'readline';
import { execSync, spawnSync } from 'child_process';

/**
 * Read a line from stdin with a prompt.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
function ask(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Read a password/token with masked input (characters replaced by '*').
 * Uses raw mode to intercept keystrokes when a TTY is available.
 * Falls back to plain readline when stdin is not a TTY (e.g., tests/pipes).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
function askSecret(prompt) {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) {
      // Non-interactive fallback (CI, piped input)
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      rl.question(prompt, answer => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let value = '';

    function onData(char) {
      if (char === '\r' || char === '\n') {
        // Enter — done
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '\u0003') {
        // Ctrl+C
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        // Backspace
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        value += char;
        process.stdout.write('*');
      }
    }

    process.stdin.on('data', onData);
  });
}

/**
 * Show a numbered menu and return the selected value.
 * @param {string} message
 * @param {{ name: string, value: string }[]} choices
 * @returns {Promise<string>}
 */
async function selectMenu(message, choices) {
  console.log(`\n${message}`);
  choices.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name}`);
  });

  while (true) {
    const input = await ask(`\nEnter choice (1-${choices.length}): `);
    const num = parseInt(input, 10);
    if (num >= 1 && num <= choices.length) {
      return choices[num - 1].value;
    }
    console.log(`Please enter a number between 1 and ${choices.length}.`);
  }
}

/**
 * Store credentials via git credential approve.
 * @param {{ protocol: string, host: string, username: string, password: string }} creds
 */
function storeCredentials({ protocol, host, username, password }) {
  const input = `protocol=${protocol}\nhost=${host}\nusername=${username}\npassword=${password}\n\n`;

  // Check that a credential helper is configured before calling approve
  try {
    const helperCheck = spawnSync('git', ['config', '--get', 'credential.helper'], {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    if (helperCheck.status !== 0) {
      console.log('  Note: No git credential helper configured. Credentials will not be persisted.');
      console.log('  To configure one, run: git config --global credential.helper store');
      return;
    }
  } catch {
    // Proceed anyway; git will handle gracefully
  }

  spawnSync('git', ['credential', 'approve'], {
    input,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

/** Provider-specific token creation URLs */
const TOKEN_URLS = {
  github: 'https://github.com/settings/tokens',
  gitlab: 'https://gitlab.com/-/profile/personal_access_tokens',
  azuredevops: 'https://dev.azure.com/{org}/_usersSettings/tokens',
  bitbucket: 'https://bitbucket.org/account/settings/app-passwords/'
};

/**
 * Collect a Personal Access Token and store it via git credential helper.
 * @param {{ url: string, name: string, type: string }} repo
 * @returns {Promise<{ method: 'token', stored: boolean }>}
 */
async function promptForToken(repo) {
  const tokenUrl = TOKEN_URLS[repo.type];
  if (tokenUrl) {
    console.log(`\nTo create a ${repo.type} personal access token:`);
    console.log(`  Visit: ${tokenUrl}`);
    console.log(`  Required scopes: repo (or read_repository)\n`);
  }

  const token = await askSecret('Enter your personal access token: ');

  if (!token) {
    console.log('No token entered. Skipping credential storage.');
    return { method: 'token', stored: false };
  }

  let protocol = 'https';
  let host = repo.url;
  try {
    const parsed = new URL(repo.url);
    protocol = parsed.protocol.replace(':', '');
    host = parsed.hostname;
  } catch {
    // URL parse failed — use raw URL as host (best-effort)
  }

  storeCredentials({ protocol, host, username: 'token', password: token });
  console.log('Credentials stored in git credential helper.');
  return { method: 'token', stored: true };
}

/**
 * Display SSH setup instructions and confirm readiness.
 * @param {{ url: string, name: string, type: string }} repo
 * @returns {Promise<{ method: 'ssh', ready: boolean }>}
 */
async function setupSSH(repo) {
  console.log('\nSSH Setup Instructions:');
  console.log('  1. Generate SSH key:');
  console.log('       ssh-keygen -t ed25519 -C "your@email.com"');
  console.log('  2. Add to SSH agent:');
  console.log('       ssh-add ~/.ssh/id_ed25519');
  console.log('  3. Copy your public key:');
  console.log('       cat ~/.ssh/id_ed25519.pub');
  console.log('  4. Add the public key to your Git provider\'s SSH keys page.');
  console.log('  5. If using HTTPS URL, convert it to SSH format:');
  console.log(`       e.g., https://github.com/org/repo → git@github.com:org/repo.git\n`);

  const answer = await ask('Have you set up SSH? (y/N): ');
  const ready = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  return { method: 'ssh', ready };
}

/**
 * Collect username/password credentials and store via git credential helper.
 * @param {{ url: string, name: string, type: string }} repo
 * @returns {Promise<{ method: 'basic', stored: boolean }>}
 */
async function promptForBasicAuth(repo) {
  const username = await ask('Username: ');
  const password = await askSecret('Password: ');

  if (!username || !password) {
    console.log('Username or password not provided. Skipping credential storage.');
    return { method: 'basic', stored: false };
  }

  let protocol = 'https';
  let host = repo.url;
  try {
    const parsed = new URL(repo.url);
    protocol = parsed.protocol.replace(':', '');
    host = parsed.hostname;
  } catch {
    // best-effort
  }

  storeCredentials({ protocol, host, username, password });
  console.log('Credentials stored in git credential helper.');
  return { method: 'basic', stored: true };
}

/**
 * Interactively prompt for credentials for a single repository.
 *
 * @param {{ url: string, name: string, type: string }} repo
 * @returns {Promise<{ skip?: boolean, method?: string, stored?: boolean, ready?: boolean }>}
 */
export async function promptForCredentials(repo) {
  console.log(`\nCredentials needed for: ${repo.name}`);
  console.log(`Repository: ${repo.url}`);
  console.log(`Type: ${repo.type}`);

  const method = await selectMenu('How would you like to authenticate?', [
    { name: 'Personal Access Token (recommended)', value: 'token' },
    { name: 'SSH Key', value: 'ssh' },
    { name: 'Username/Password', value: 'basic' },
    { name: 'Skip this repository', value: 'skip' }
  ]);

  if (method === 'skip') {
    return { skip: true };
  }

  if (method === 'token') {
    return promptForToken(repo);
  }

  if (method === 'ssh') {
    return setupSSH(repo);
  }

  if (method === 'basic') {
    return promptForBasicAuth(repo);
  }
}

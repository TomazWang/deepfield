## 1. Marketplace File

- [x] 1.1 Create `.claude-plugin/` directory at the repository root
- [x] 1.2 Create `.claude-plugin/marketplace.json` with marketplace name `deepfield`, owner `TomazWang`, and the `deepfield` plugin entry pointing to `"./plugin"`

## 2. Validation

- [x] 2.1 Verify `claude plugin validate .` passes from the repo root (or manually confirm JSON is valid)

## 3. Documentation

- [x] 3.1 Add installation section to `README.md` with the two commands: `/plugin marketplace add TomazWang/deepfield` and `/plugin install deepfield@deepfield`

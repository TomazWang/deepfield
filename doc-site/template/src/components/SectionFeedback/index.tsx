import React, { useState, useCallback } from 'react';
import Giscus from '@giscus/react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode } from '@docusaurus/theme-common';
import styles from './styles.module.css';

interface Props {
  /** The heading ID — used as the Giscus discussion term for section scoping */
  sectionId: string;
  /** Human-readable section title — shown in the tooltip */
  sectionTitle: string;
}

/**
 * SectionFeedback — renders an inline comment button next to section headings.
 *
 * When clicked, expands a Giscus discussion panel scoped to this specific
 * section (via the `sectionId` as the Giscus `term`).
 *
 * Requires Giscus to be configured in docusaurus.config.ts customFields:
 *   giscusRepo, giscusRepoId, giscusCategoryId, feedbackEnabled
 *
 * Giscus setup: https://giscus.app — enable GitHub Discussions on your repo,
 * then copy the repo/repoId/categoryId values into docusaurus.config.ts.
 */
export default function SectionFeedback({ sectionId, sectionTitle }: Props) {
  const [open, setOpen] = useState(false);
  const { siteConfig } = useDocusaurusContext();
  const { colorMode } = useColorMode();

  const {
    giscusRepo,
    giscusRepoId,
    giscusCategoryId,
    feedbackEnabled,
  } = siteConfig.customFields as {
    giscusRepo: string;
    giscusRepoId: string;
    giscusCategoryId: string;
    feedbackEnabled: string;
  };

  // If Giscus is not configured, render nothing
  if (feedbackEnabled !== 'true' || !giscusRepo) {
    return null;
  }

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen((prev) => !prev);
    },
    []
  );

  return (
    <span className={styles.container}>
      <button
        className={`${styles.button} ${open ? styles.buttonActive : ''}`}
        onClick={handleToggle}
        title={`Comment on "${sectionTitle}"`}
        aria-label={`Toggle feedback for section: ${sectionTitle}`}
        aria-expanded={open}
      >
        <span className={styles.icon} aria-hidden="true">
          💬
        </span>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              Feedback: {sectionTitle}
            </span>
            <button
              className={styles.closeButton}
              onClick={handleToggle}
              aria-label="Close feedback"
            >
              ✕
            </button>
          </div>
          <Giscus
            repo={giscusRepo as `${string}/${string}`}
            repoId={giscusRepoId}
            category="Knowledge Base Feedback"
            categoryId={giscusCategoryId}
            mapping="specific"
            term={sectionId}
            strict="1"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={colorMode === 'dark' ? 'dark' : 'light'}
            lang="en"
            loading="lazy"
          />
        </div>
      )}
    </span>
  );
}

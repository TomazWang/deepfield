/**
 * Swizzled MDXComponents — wraps h2 and h3 headings with SectionFeedback.
 *
 * This is a "wrap" swizzle (not an unsafe replacement), so Docusaurus's
 * default MDX handling is preserved and feedback is layered on top.
 */
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import SectionFeedback from '@site/src/components/SectionFeedback';

type HeadingTag = 'h2' | 'h3';

interface HeadingProps {
  children?: React.ReactNode;
  id?: string;
  [key: string]: unknown;
}

/**
 * Returns a heading component that appends a SectionFeedback button.
 */
function withFeedback(Tag: HeadingTag) {
  return function HeadingWithFeedback({ children, id, ...props }: HeadingProps) {
    const titleText = typeof children === 'string'
      ? children
      : id?.replace(/-/g, ' ') ?? String(Tag);

    return (
      <Tag id={id} {...props}>
        {children}
        {id && (
          <SectionFeedback
            sectionId={id}
            sectionTitle={titleText}
          />
        )}
      </Tag>
    );
  };
}

export default {
  ...MDXComponents,
  h2: withFeedback('h2'),
  h3: withFeedback('h3'),
};

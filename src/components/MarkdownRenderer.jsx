import React, { useMemo } from 'react';
import './MarkdownRenderer.css';

/**
 * Simple Markdown renderer.
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url),
 * headers (#, ##, ###), lists (- / 1.), blockquotes (>), horizontal rules (---),
 * checkboxes (- [ ] / - [x])
 */
const MarkdownRenderer = ({ content }) => {
  const html = useMemo(() => {
    if (!content) return '';
    let text = content
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```
    text = text.replace(/```([\s\S]*?)```/g, '<pre class="md-code-block">$1</pre>');

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');

    // Headers
    text = text.replace(/^### (.+)$/gm, '<h4 class="md-h3">$1</h4>');
    text = text.replace(/^## (.+)$/gm, '<h3 class="md-h2">$1</h3>');
    text = text.replace(/^# (.+)$/gm, '<h2 class="md-h1">$1</h2>');

    // Horizontal rule
    text = text.replace(/^---$/gm, '<hr class="md-hr" />');

    // Blockquote
    text = text.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>');

    // Bold & Italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links (sanitize: only http/https)
    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
    );

    // Checkboxes
    text = text.replace(/^- \[x\] (.+)$/gm, '<div class="md-checkbox checked"><span class="md-check">✓</span> $1</div>');
    text = text.replace(/^- \[ \] (.+)$/gm, '<div class="md-checkbox"><span class="md-check">○</span> $1</div>');

    // Unordered lists
    text = text.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');
    text = text.replace(/(<li class="md-li">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>');

    // Ordered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>');
    text = text.replace(/(<li class="md-oli">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

    // Paragraphs (double newline)
    text = text.replace(/\n\n/g, '</p><p class="md-p">');

    // Single newlines to <br>
    text = text.replace(/\n/g, '<br/>');

    return `<p class="md-p">${text}</p>`;
  }, [content]);

  if (!content) return null;

  return (
    <div
      className="markdown-renderer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;

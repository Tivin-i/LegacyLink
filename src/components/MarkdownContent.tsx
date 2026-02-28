import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown as React nodes. Uses react-markdown (no raw HTML by default).
 * remark-gfm adds tables, strikethrough, etc.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content || String(content).trim() === "") return null;
  return (
    <div className={className ?? "content-body markdown-content"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content)}</ReactMarkdown>
    </div>
  );
}

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * GitHub-flavoured markdown for notes, document bodies, and dataset caveats.
 * Raw HTML is never rendered; links open in a new tab without an opener.
 */
export function Markdown({
  children,
  size,
  onNoteLink,
  resolved,
  onToggleTask,
  headingLines,
}: {
  children: string;
  size?: "sm";
  /** Handles `#note=Title` links produced by `wikilinksToMarkdown`; without it they render as plain text. */
  onNoteLink?: (title: string) => void;
  /** Returns false for a link to a note that does not exist yet, which then renders muted. */
  resolved?: (title: string) => boolean;
  /** Makes task checkboxes clickable; receives the 1-based source line of the task. */
  onToggleTask?: (line: number) => void;
  /** Marks headings with `data-line` (their 1-based source line) so an outline can scroll to them. */
  headingLines?: boolean;
}) {
  const heading = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"): Components[typeof Tag] =>
    function Heading({ node, ...props }) {
      return <Tag {...props} data-line={headingLines ? node?.position?.start.line : undefined} />;
    };
  const components: Components = {
    a: ({ href, children: label }) => {
      if (href?.startsWith("#note=")) {
        const title = decodeURIComponent(href.slice("#note=".length));
        if (!onNoteLink) return <span>{label}</span>;
        return (
          <button type="button" className="bos-wikilink" data-unresolved={resolved && !resolved(title) ? "" : undefined} onClick={() => onNoteLink(title)}>
            {label}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    },
    table: ({ children: body }) => (
      <div className="overflow-x-auto">
        <table>{body}</table>
      </div>
    ),
  };
  if (headingLines) {
    for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"] as const) components[tag] = heading(tag);
  }
  if (onToggleTask) {
    // The generated checkbox carries no source position, but its list item does.
    components.li = ({ node, ...props }) => <li {...props} data-line={node?.position?.start.line} />;
    components.input = ({ node, ...props }) => {
      void node;
      if (props.type !== "checkbox") return <input {...props} />;
      return (
        <input
          type="checkbox"
          checked={props.checked ?? false}
          aria-label="Done"
          onChange={(event) => {
            const line = Number(event.currentTarget.closest("li")?.dataset.line);
            if (line > 0) onToggleTask(line);
          }}
        />
      );
    };
  }
  return (
    <div className="bos-md" data-size={size}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

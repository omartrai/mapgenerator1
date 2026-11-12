import type { ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";

/**
 * A collapsible group in a settings panel: the header shows the title and,
 * when closed, the current choice, so a long panel reads as a short list.
 */
export default function PanelGroup({
  id,
  title,
  summary,
  preview,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  summary?: string;
  /** Small visual of the current choice, shown at the start of the header. */
  preview?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const bodyId = `panel-group-${id}`;
  return (
    <div className={`panel-group${open ? " is-open" : ""}`} data-group={id}>
      <button type="button" className="panel-group__head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        {preview && !open ? <span className="panel-group__preview">{preview}</span> : null}
        <span className="panel-group__text">
          <span className="panel-group__title">{title}</span>
          {!open && summary ? <span className="panel-group__summary">{summary}</span> : null}
        </span>
        <LuChevronDown className="panel-group__chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div className="panel-group__body" id={bodyId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

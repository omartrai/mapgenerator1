import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export interface FontChoice {
  value: string;
  label: string;
  /** Typeface the option is drawn in; null = the surrounding font. */
  family: string | null;
  /** Size correction for faces that run small (script faces). */
  boost?: number;
}

interface FontDropdownProps {
  label: string;
  options: FontChoice[];
  value: string;
  onChange: (value: string) => void;
  /** Called once the list opens, e.g. to load the faces for the previews. */
  onOpen?: () => void;
}

const fontStack = (choice: FontChoice) =>
  choice.family ? `"${choice.family}", "Space Grotesk", sans-serif` : undefined;

/** A drop-down list of fonts in which each option is shown in its own face. */
export default function FontDropdown({ label, options, value, onChange, onOpen }: FontDropdownProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [maxHeight, setMaxHeight] = useState(300);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  const show = () => {
    // Open where there is more room, and never under the sticky step
    // buttons at the foot of the studio panel (about 120px).
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom - 130;
      const above = rect.top - 90;
      const openUp = below < 220 && above > below;
      setUp(openUp);
      setMaxHeight(Math.max(160, Math.min(300, openUp ? above : below)));
    }
    setActive(selectedIndex);
    setOpen(true);
    onOpen?.();
  };
  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };
  const choose = (index: number) => {
    const choice = options[index];
    if (choice) onChange(choice.value);
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.focus();
    const outside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onButtonKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show();
    }
  };
  const onListKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") setActive((index) => Math.min(options.length - 1, index + 1));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(0, index - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(options.length - 1);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Tab") return close(false);
      close();
    } else return;
    event.preventDefault();
  };

  return (
    <div className={`font-dropdown${open ? " is-open" : ""}`} ref={rootRef}>
      <span className="font-dropdown__label" id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="font-dropdown__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onButtonKey}
      >
        <span
          id={`${id}-value`}
          className="font-dropdown__value"
          style={{ fontFamily: fontStack(selected), fontSize: selected?.boost ? `${selected.boost}em` : undefined }}
        >
          {selected?.label}
        </span>
        <LuChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <ul
          ref={listRef}
          className={`font-dropdown__list${up ? " is-up" : ""}`}
          style={{ maxHeight }}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((option, index) => (
            <li
              key={option.value || "default"}
              id={`${id}-opt-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              className={`font-dropdown__option${index === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span style={{ fontFamily: fontStack(option), fontSize: option.boost ? `${option.boost}em` : undefined }}>
                {option.label}
              </span>
              {option.value === value ? <LuCheck aria-hidden="true" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

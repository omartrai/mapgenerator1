import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LuChevronDown, LuFlag, LuSearch } from "react-icons/lu";
import type { RaceEntry } from "@/core/services";

/** Lowercase without accents, so "fes" finds "Fès". */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Searchable race picker: type part of a race or city name, then pick it
 * with a click or the arrow keys and Enter.
 */
export default function RaceSearch({
  races,
  selectedId,
  disabled,
  placeholder,
  emptyLabel,
  label,
  describe,
  onPick,
}: {
  races: RaceEntry[];
  selectedId: string;
  disabled?: boolean;
  placeholder: string;
  emptyLabel: string;
  label: string;
  describe: (race: RaceEntry) => string;
  onPick: (race: RaceEntry) => void;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = races.find((race) => race.id === selectedId);

  const matches = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return races;
    return races.filter((race) => {
      const text = fold(`${race.name} ${race.city ?? ""}`);
      return words.every((word) => text.includes(word));
    });
  }, [query, races]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (race: RaceEntry) => {
    onPick(race);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={`race-search${open ? " is-open" : ""}`} ref={rootRef}>
      <div className="race-search__field">
        {open ? <LuSearch aria-hidden="true" /> : <LuFlag aria-hidden="true" />}
        <input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-${matches[active].id}` : undefined}
          disabled={disabled}
          value={open ? query : selected ? selected.name : ""}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((value) => Math.min(value + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            } else if (event.key === "Enter" && open && matches[active]) {
              event.preventDefault();
              pick(matches[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
              (event.target as HTMLInputElement).blur();
            }
          }}
        />
        <LuChevronDown className="race-search__chevron" aria-hidden="true" />
      </div>
      {open ? (
        <ul className="race-search__list" id={`${id}-list`} role="listbox">
          {matches.length ? (
            matches.map((race, index) => (
              <li
                key={race.id}
                id={`${id}-${race.id}`}
                role="option"
                aria-selected={race.id === selectedId}
                className={`race-search__option${index === active ? " is-active" : ""}${race.id === selectedId ? " is-selected" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(race)}
              >
                <span className="race-search__name">{race.name}</span>
                <span className="race-search__meta">{describe(race).replace(race.name, "").replace(/^\s*—\s*/, "")}</span>
              </li>
            ))
          ) : (
            <li className="race-search__empty">{emptyLabel}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

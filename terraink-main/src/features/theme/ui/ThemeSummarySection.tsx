import { useMemo, useState, type RefObject } from "react";
import ThemeCard from "./ThemeCard";
import { EditIcon } from "@/shared/ui/Icons";
import type { ThemeOption } from "../domain/types";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface ThemeSummarySectionProps {
  listRef?: RefObject<HTMLDivElement>;
  themeOptions: ThemeOption[];
  selectedThemeId: string;
  selectedThemeOption: ThemeOption;
  onThemeSelect: (themeId: string) => void;
  onCustomize: () => void;
}

type ThemeFilter = "popular" | "light" | "dark" | "all";

/** How many themes (in curated order) count as "popular". */
const POPULAR_COUNT = 9;

function luminance(hex: string | undefined): number {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? "");
  if (!match) return 1;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** A theme is "dark" when its land colour (map.land, palette entry 2) is dark. */
function isDarkTheme(theme: ThemeOption): boolean {
  return luminance(theme.palette?.[2] ?? theme.palette?.[0]) < 0.45;
}

export default function ThemeSummarySection({
  listRef,
  themeOptions,
  selectedThemeId,
  selectedThemeOption,
  onThemeSelect,
  onCustomize,
}: ThemeSummarySectionProps) {
  const { t } = useLanguage();
  const description =
    selectedThemeOption.description?.trim() || t("theme.noDescription");

  const popularIds = useMemo(
    () => new Set(themeOptions.slice(0, POPULAR_COUNT).map((theme) => theme.id)),
    [themeOptions],
  );
  // Always open on the short list; the chosen palette is shown in it.
  const [filter, setFilter] = useState<ThemeFilter>("popular");

  const visible = useMemo(() => {
    switch (filter) {
      case "popular":
        return themeOptions.filter((theme) => popularIds.has(theme.id) || theme.id === selectedThemeId);
      case "light":
        return themeOptions.filter((theme) => !isDarkTheme(theme));
      case "dark":
        return themeOptions.filter(isDarkTheme);
      default:
        return themeOptions;
    }
  }, [filter, themeOptions, popularIds, selectedThemeId]);

  const filters: { id: ThemeFilter; label: string }[] = [
    { id: "popular", label: t("theme.filter.popular") },
    { id: "light", label: t("theme.filter.light") },
    { id: "dark", label: t("theme.filter.dark") },
    { id: "all", label: t("theme.filter.all") },
  ];

  return (
    <div className="theme-summary-view theme-picker">
      <div className="theme-picker__current">
        <span
          className="theme-picker__dot"
          aria-hidden="true"
          style={{
            background: `linear-gradient(135deg, ${selectedThemeOption.palette?.[0] ?? "#eee"} 50%, ${selectedThemeOption.palette?.[1] ?? "#333"} 50%)`,
          }}
        />
        <div className="theme-picker__copy">
          <p className="theme-picker__name">{selectedThemeOption.name}</p>
          <p className="theme-picker__desc">{description}</p>
        </div>
        <button
          type="button"
          className="theme-picker__edit"
          onClick={onCustomize}
          aria-label={`${t("theme.customize")}: ${selectedThemeOption.name}`}
        >
          <EditIcon />
          <span>{t("theme.colors")}</span>
        </button>
      </div>

      <div className="theme-picker__filters" role="tablist" aria-label={t("theme.options")}>
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`theme-picker__filter${filter === item.id ? " is-active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="theme-card-list card-scroll-list"
        role="list"
        aria-label={t("theme.options")}
        ref={listRef}
      >
        {visible.map((themeOption) => (
          <ThemeCard
            key={themeOption.id}
            themeOption={themeOption}
            isSelected={themeOption.id === selectedThemeId}
            onClick={() => onThemeSelect(themeOption.id)}
          />
        ))}
      </div>

      {filter === "popular" && themeOptions.length > POPULAR_COUNT ? (
        <button
          type="button"
          className="theme-picker__more"
          onClick={() => setFilter("all")}
        >
          {t("theme.showAll").replace("{n}", String(themeOptions.length - POPULAR_COUNT))}
        </button>
      ) : null}
    </div>
  );
}

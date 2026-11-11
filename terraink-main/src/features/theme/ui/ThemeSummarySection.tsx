import type { RefObject } from "react";
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

  return (
    <div className="theme-summary-view">
      <div className="theme-summary-head">
        <div className="theme-summary-copy">
          <p className="theme-summary-label">
            {t("theme.label")}: <span className="theme-summary-label-name">{selectedThemeOption.name}</span>
          </p>
          <p className="theme-card-description">{description}</p>
        </div>
        <button
          type="button"
          className="theme-customize-btn"
          onClick={onCustomize}
          aria-label={`${t("theme.customize")}: ${selectedThemeOption.name}`}
        >
          <span className="theme-customize-icon" aria-hidden="true">
            <EditIcon />
          </span>
        </button>
      </div>

      <div
        className="theme-card-list card-scroll-list"
        role="list"
        aria-label={t("theme.options")}
        ref={listRef}
      >
        {themeOptions.map((themeOption) => (
          <ThemeCard
            key={themeOption.id}
            themeOption={themeOption}
            isSelected={themeOption.id === selectedThemeId}
            onClick={() => onThemeSelect(themeOption.id)}
          />
        ))}
      </div>
    </div>
  );
}

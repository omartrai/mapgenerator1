import {
  memo,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { MarkerIconDefinition } from "@/features/markers/domain/types";
import { predefinedMarkerIcons } from "@/features/markers/infrastructure/iconRegistry";
import { SearchIcon } from "@/shared/ui/Icons";
import { CloseIcon } from "@/shared/ui/Icons";
import MarkerVisual from "./MarkerVisual";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const DEFAULT_VISIBLE_ICON_COUNT = 16;

interface MarkerPickerProps {
  selectedIconId?: string;
  markerColor: string;
  customIcons: MarkerIconDefinition[];
  onIconClick: (iconId: string) => void;
  onUploadIcon?: (file: File) => void | Promise<void>;
  onRemoveUploadedIcon?: (iconId: string) => void;
  onClearUploadedIcons?: () => void;
  actionSlot?: ReactNode;
  showIntro?: boolean;
  showUploadedIcons?: boolean;
}

const MarkerPicker = memo(function MarkerPicker({
  selectedIconId,
  markerColor,
  customIcons,
  onIconClick,
  onUploadIcon,
  onRemoveUploadedIcon,
  onClearUploadedIcons,
  actionSlot,
  showIntro = true,
  showUploadedIcons = true,
}: MarkerPickerProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const appIcons = useMemo(() => predefinedMarkerIcons, []);
  const filteredAppIcons = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) {
      return appIcons;
    }
    return appIcons.filter((icon) =>
      icon.label.toLocaleLowerCase().includes(query),
    );
  }, [appIcons, searchQuery]);
  const shouldShowAllIcons =
    searchQuery.trim().length > 0 ||
    isExpanded ||
    (selectedIconId
      ? !appIcons
          .slice(0, DEFAULT_VISIBLE_ICON_COUNT)
          .some((icon) => icon.id === selectedIconId)
      : false);
  const visibleAppIcons = shouldShowAllIcons
    ? filteredAppIcons
    : filteredAppIcons.slice(0, DEFAULT_VISIBLE_ICON_COUNT);

  const handleUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadIcon) {
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      !file.name.toLowerCase().endsWith(".svg")
    ) {
      setUploadError(t("icons.uploadTypeError"));
      return;
    }

    setUploadError("");
    setIsExpanded(true);

    try {
      await onUploadIcon(file);
    } catch {
      setUploadError(t("icons.uploadError"));
    }
  };

  return (
    <div className="marker-picker">
      {showIntro ? (
        <div className="marker-picker__intro">
          <p className="marker-picker__description">
            {t("icons.intro")}
          </p>
        </div>
      ) : null}

      {showUploadedIcons ? (
        <div className="marker-picker__uploaded-section">
          <p className="marker-picker__section-title">{t("icons.yours")}</p>
          <p className="marker-picker__uploaded-description">
            {t("icons.uploadedDescription")}
          </p>
          <div className="marker-picker__grid marker-picker__grid--uploaded">
            {customIcons.map((icon) => (
              <div className="marker-picker__uploaded-option" key={icon.id}>
                <button
                  type="button"
                  className={`marker-picker__option marker-picker__option--uploaded${
                    selectedIconId === icon.id ? " is-selected" : ""
                  }`}
                  onClick={() => onIconClick(icon.id)}
                  title={icon.label}
                  aria-label={`${t("icons.addAria")} ${icon.label}`}
                >
                  <MarkerVisual icon={icon} size={24} color={markerColor} />
                  <span className="marker-picker__label">{icon.label}</span>
                </button>
                {onRemoveUploadedIcon ? (
                  <button
                    type="button"
                    className="marker-picker__remove-uploaded"
                    onClick={() => onRemoveUploadedIcon(icon.id)}
                    aria-label={`${t("icons.removeUploaded")} ${icon.label}`}
                    title={t("icons.removeUploaded")}
                  >
                    <CloseIcon />
                  </button>
                ) : null}
              </div>
            ))}

            {onUploadIcon ? (
              <>
                <button
                  type="button"
                  className="marker-picker__option marker-picker__option--upload-tile"
                  onClick={() => inputRef.current?.click()}
                  title={t("icons.upload")}
                  aria-label={t("icons.uploadAria")}
                >
                  <span className="marker-picker__upload-plus" aria-hidden="true">
                    +
                  </span>
                  <span className="marker-picker__label">{t("icons.upload")}</span>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".svg,image/*"
                  className="marker-picker__file-input"
                  onChange={handleUploadChange}
                />
              </>
            ) : null}
          </div>

          {onClearUploadedIcons && customIcons.length > 0 ? (
            <button
              type="button"
              className="marker-picker__clear-uploaded"
              onClick={onClearUploadedIcons}
            >
              {t("common.removeAll")}
            </button>
          ) : null}
        </div>
      ) : null}

      <label className="marker-picker__search-label" htmlFor="marker-icon-search">
        {t("icons.add")}
      </label>
      <div className="marker-picker__search-field">
        <SearchIcon aria-hidden="true" />
        <input
          id="marker-icon-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("icons.search")}
          autoComplete="off"
        />
      </div>

      <div className="marker-picker__grid">
        {visibleAppIcons.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`marker-picker__option${
              selectedIconId === icon.id ? " is-selected" : ""
            }`}
            onClick={() => onIconClick(icon.id)}
            title={icon.label}
            aria-label={`${t("icons.addAria")} ${icon.label}`}
          >
            <MarkerVisual icon={icon} size={24} color={markerColor} />
            <span className="marker-picker__label">{icon.label}</span>
          </button>
        ))}
      </div>

      {visibleAppIcons.length === 0 ? (
        <p className="marker-picker__empty">{t("icons.noMatch")} “{searchQuery}”.</p>
      ) : null}

      {!searchQuery.trim() && appIcons.length > DEFAULT_VISIBLE_ICON_COUNT ? (
        <button
          type="button"
          className="marker-picker__load-more"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? t("icons.showLess") : t("icons.loadMore")}
        </button>
      ) : null}

      {actionSlot ? (
        <>
          <div className="marker-picker__divider marker-picker__divider--actions" />
          <div className="marker-picker__actions">{actionSlot}</div>
        </>
      ) : null}

      {uploadError ? <p className="marker-picker__error">{uploadError}</p> : null}
    </div>
  );
});

export default MarkerPicker;

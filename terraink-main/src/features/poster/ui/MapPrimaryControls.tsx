import { LockIcon, RecenterIcon, UnlockIcon } from "@/shared/ui/Icons";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface MapPrimaryControlsProps {
  isMapEditing: boolean;
  isMarkerEditorActive: boolean;
  recenterHint: string;
  unlockHint: string;
  onRecenter: () => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
}

export default function MapPrimaryControls({
  isMapEditing,
  isMarkerEditorActive,
  recenterHint,
  unlockHint,
  onRecenter,
  onStartEditing,
  onFinishEditing,
}: MapPrimaryControlsProps) {
  const { t } = useLanguage();
  return (
    <>
      {!isMapEditing ? (
        <button
          type="button"
          className="map-control-btn"
          onClick={onRecenter}
          title={recenterHint}
        >
          <RecenterIcon />
          <span>{t("map.recenter")}</span>
        </button>
      ) : null}
      {isMapEditing ? (
        <button
          type="button"
          className="map-control-btn map-control-btn--primary map-control-btn--mode"
          onClick={onFinishEditing}
          title={t("map.lockHint")}
        >
          <LockIcon />
          <span>{t("map.lock")}</span>
        </button>
      ) : (
        <button
          type="button"
          className="map-control-btn map-control-btn--primary map-control-btn--mode"
          onClick={onStartEditing}
          title={unlockHint}
          disabled={isMarkerEditorActive}
        >
          <UnlockIcon />
          <span>{t("map.edit")}</span>
        </button>
      )}
    </>
  );
}

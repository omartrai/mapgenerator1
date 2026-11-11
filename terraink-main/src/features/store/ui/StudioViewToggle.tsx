import { useStore } from "./StoreContext";
import { useStoreText } from "./storeText";

/** Switches the preview backdrop between the studio and a room wall. */
export default function StudioViewToggle() {
  const { scene, setScene } = useStore();
  const { t } = useStoreText();
  return (
    <div className="studio-view-toggle segmented segmented--compact" role="radiogroup" aria-label={t("view.label")}>
      <button
        type="button"
        role="radio"
        aria-checked={scene === "studio"}
        className={`segmented__option${scene === "studio" ? " is-selected" : ""}`}
        onClick={() => setScene("studio")}
      >
        {t("view.studio")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={scene === "wall"}
        className={`segmented__option${scene === "wall" ? " is-selected" : ""}`}
        onClick={() => setScene("wall")}
      >
        {t("view.wall")}
      </button>
    </div>
  );
}

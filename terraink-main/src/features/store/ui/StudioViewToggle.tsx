import { useStore } from "./StoreContext";

/** Switches the preview backdrop between the studio and a room wall. */
export default function StudioViewToggle() {
  const { scene, setScene } = useStore();
  return (
    <div className="studio-view-toggle segmented segmented--compact" role="radiogroup" aria-label="Preview background">
      <button
        type="button"
        role="radio"
        aria-checked={scene === "studio"}
        className={`segmented__option${scene === "studio" ? " is-selected" : ""}`}
        onClick={() => setScene("studio")}
      >
        Studio
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={scene === "wall"}
        className={`segmented__option${scene === "wall" ? " is-selected" : ""}`}
        onClick={() => setScene("wall")}
      >
        On the wall
      </button>
    </div>
  );
}

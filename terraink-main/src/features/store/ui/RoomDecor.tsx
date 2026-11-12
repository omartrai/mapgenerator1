import { resolveDimensions } from "../domain/catalog";
import { useStore } from "./StoreContext";
import { useStoreText } from "./storeText";

const formatCm = (value: number) => String(Math.round(value * 10) / 10);

/**
 * Backdrop behind the studio preview: plain in "Studio", a furnished room
 * photo in "Au mur" where the poster hangs to scale (see home.css).
 */
export default function RoomDecor() {
  const { scene, product } = useStore();
  const { t } = useStoreText();
  const { widthCm, heightCm } = resolveDimensions(product);
  return (
    <>
      <div className={`room-decor room-decor--${scene}`} aria-hidden="true" />
      {scene === "wall" ? (
        <p className="room-decor__scale">
          {t("wall.scale", { size: `${formatCm(widthCm)} × ${formatCm(heightCm)} cm` })}
        </p>
      ) : null}
    </>
  );
}

import { useStore } from "./StoreContext";

/**
 * Backdrop behind the studio preview: plain in "Studio", a furnished room
 * photo in "Au mur" (the poster is placed over the photo's empty frame).
 */
export default function RoomDecor() {
  const { scene } = useStore();
  return <div className={`room-decor room-decor--${scene}`} aria-hidden="true" />;
}

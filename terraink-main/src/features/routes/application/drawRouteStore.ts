import { useSyncExternalStore } from "react";

/**
 * Hand-drawn route: whether the customer is placing points on the poster,
 * and the points so far ([lat, lon]). Shared by the route card (buttons)
 * and the preview (the click layer).
 */
export interface DrawState {
  active: boolean;
  points: { lat: number; lon: number }[];
}

let current: DrawState = { active: false, points: [] };
const listeners = new Set<() => void>();

export const drawRouteStore = {
  get: () => current,
  set(next: Partial<DrawState>) {
    current = { ...current, ...next };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useDrawRouteState(): DrawState {
  return useSyncExternalStore(drawRouteStore.subscribe, drawRouteStore.get, drawRouteStore.get);
}

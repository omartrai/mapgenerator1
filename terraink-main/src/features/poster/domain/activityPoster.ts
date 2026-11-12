/**
 * What the sport (activity) layout prints besides the title and message:
 * the date/distance line, up to four stats, the elevation profile and the
 * accent colour (the route's colour). Read from the form and the routes.
 */
import type { Route } from "@/features/routes/domain/types";
import type { StatField } from "@/features/routes/domain/activity";

export interface ActivityPrint {
  subtitle: string;
  stats: StatField[];
  profile: number[];
  accent: string;
}

export const ACTIVITY_STAT_COUNT = 4;
export const DEFAULT_ACCENT = "#e8622c";

type ActivityForm = Record<string, unknown>;

export const statValueField = (i: number) => `activityStat${i + 1}`;
export const statLabelField = (i: number) => `activityStat${i + 1}Label`;

export function activityFromForm(form: ActivityForm, routes: Route[]): ActivityPrint {
  const route = routes.find((entry) => entry.visible && entry.stats?.profile?.length) ?? routes.find((entry) => entry.visible);
  const stats: StatField[] = [];
  for (let i = 0; i < ACTIVITY_STAT_COUNT; i += 1) {
    const value = String(form[statValueField(i)] ?? "").trim();
    if (value) stats.push({ value, label: String(form[statLabelField(i)] ?? "").trim().toUpperCase() });
  }
  return {
    subtitle: String(form.activitySubtitle ?? "").trim().toUpperCase(),
    stats,
    profile: route?.stats?.profile ?? [],
    accent: route?.color || DEFAULT_ACCENT,
  };
}

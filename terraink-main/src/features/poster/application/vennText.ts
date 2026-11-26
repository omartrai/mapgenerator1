import type { PosterForm } from "./posterReducer";
import { getPosterLayout } from "@/features/poster/domain/posterLayout";
import { formatSkyDate } from "@/features/sky/application/useSkyPoster";
import { defaultSkyTime } from "@/features/sky/application/skyOptions";

const LABELS: Record<string, { where: string; when: string }> = {
  en: { where: "Where", when: "When" },
  fr: { where: "Où", when: "Quand" },
  ar: { where: "أين", when: "متى" },
};

/**
 * Where & when poster: the names take the title line, the place
 * ("Dublin, Ireland") goes under the map, and the date under the sky.
 * null when the poster is another layout.
 */
export function vennTextFromForm(form: PosterForm, city: string, country: string, language: string) {
  if (!getPosterLayout(form.posterLayout).venn) return null;
  const labels = LABELS[language] ?? LABELS.fr;
  return {
    city: form.vennNames ?? "",
    country: [city, country].map((part) => part.trim()).filter(Boolean).join(", "),
    labels: { ...labels, date: formatSkyDate(form.skyTime || defaultSkyTime(), language) },
  };
}

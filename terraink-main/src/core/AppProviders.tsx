import type { ReactNode } from "react";
import { PosterProvider } from "@/features/poster/ui/PosterContext";
import { LanguageProvider } from "@/shared/i18n/LanguageContext";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Wraps the application in all required context providers.
 * Add new providers here as needed.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <PosterProvider>{children}</PosterProvider>
    </LanguageProvider>
  );
}

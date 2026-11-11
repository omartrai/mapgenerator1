import type { ReactNode } from "react";
import { PosterProvider } from "@/features/poster/ui/PosterContext";
import { StoreProvider } from "@/features/store/ui/StoreContext";
import { LanguageProvider } from "@/shared/i18n/LanguageContext";
import { RouterProvider } from "@/core/router/router";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Wraps the application in all required context providers.
 * Add new providers here as needed.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <RouterProvider>
      <LanguageProvider>
        <PosterProvider>
          <StoreProvider>{children}</StoreProvider>
        </PosterProvider>
      </LanguageProvider>
    </RouterProvider>
  );
}

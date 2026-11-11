import { AppProviders } from "@/core/AppProviders";
import AppRouter from "@/shared/ui/AppRouter";

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

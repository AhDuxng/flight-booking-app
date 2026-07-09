import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}

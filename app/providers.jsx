"use client";

import { ThemeProvider } from "../lib/theme.js";
import { LanguageProvider } from "../lib/i18n.js";
import TopControls from "../components/TopControls.jsx";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TopControls />
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}

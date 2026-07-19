/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0F1222",
        panel: "#171B2E",
        panelAlt: "#1E2338",
        border: "#2A3050",
        accent: "#F2A65A",
        accentDim: "#B97A3F",
        mint: "#6EE7B7",
        coral: "#F2707A",
        textPrimary: "#E8E9F3",
        textMuted: "#8B90A8",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

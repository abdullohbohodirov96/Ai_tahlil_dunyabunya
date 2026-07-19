import "./globals.css";

export const metadata = {
  title: "Jarvis — Biznes Nazorat Markazi",
  description: "Barcha bo'limlar bo'yicha analitika va boshqaruv markazi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-textPrimary font-body">{children}</body>
    </html>
  );
}

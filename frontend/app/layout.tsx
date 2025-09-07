// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/theme";
import NavBar from "@/app/components/NavBar";

export const metadata: Metadata = {
  title: "My Outfit",
  description: "Dialed-in menswear, powered by AI",
};
const noFlash = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var t = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <ThemeProvider>
          <NavBar />
          <div className="container">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
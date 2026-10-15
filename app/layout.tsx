import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./southeast.css";
import "./southeast-coffee.css";
import "./southeast-wordsearch.css";
import "./southeast-passport.css";
import "./southeast-river.css";

export const metadata: Metadata = {
  title: "Pegadas do Brasil — Jogo de Geografia",
  description: "Uma aventura educativa pelas regiões do Brasil para crianças de 7 a 10 anos.",
  icons: {
    icon: [{ url: "/favicon-64.png", type: "image/png", sizes: "64x64" }],
    shortcut: "/favicon-64.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

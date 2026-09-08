import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pegadas do Brasil — Jogo de Geografia",
  description: "Uma aventura educativa pelas regiões do Brasil para crianças de 7 a 10 anos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

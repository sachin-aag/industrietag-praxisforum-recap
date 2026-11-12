import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Praxisforum 2026 – Recap | KI in Planung, Bau und Gebäudebetrieb",
    template: "%s | Praxisforum 2026 Recap",
  },
  description:
    "Recap des Industrietag Rems-Murr Praxisforum am 10. November 2026 im Bürgerhaus Kernen: Impulse, zwei Fachforen und Hausmesse rund um KI in Planung, Bau und Gebäudebetrieb.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

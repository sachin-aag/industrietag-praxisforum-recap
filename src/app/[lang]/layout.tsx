import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import "../globals.css";
import { isLocale, locales } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { pageMetadata, siteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#2a4b9b",
  colorScheme: "light",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const copy = t(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: copy.metaTitleDefault, template: copy.metaTitleTemplate },
    applicationName: "Praxisforum 2026",
    authors: [{ name: "Wilhelm Schetter GmbH Haustechnik" }, { name: "Gamechangerz" }],
    keywords:
      lang === "de"
        ? ["Industrietag Rems-Murr", "Praxisforum 2026", "KI im Bau", "KI Gebäudetechnik", "TGA", "BIM", "Gebäudebetrieb", "Schetter", "Gamechangerz", "Kernen im Remstal"]
        : ["Industrietag Rems-Murr", "Praxisforum 2026", "AI in construction", "building services", "BIM", "building operations", "Schetter", "Gamechangerz"],
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
    ...pageMetadata(lang, "/"),
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Roboto+Condensed:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

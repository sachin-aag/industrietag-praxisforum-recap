import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";

/** Canonical origin. SITE_URL wins; on Vercel the production domain is used automatically. */
export function siteUrl(): string {
  const explicit = process.env.SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return "https://industrietag-praxisforum-recap.vercel.app";
}

export const ogLocale: Record<Locale, string> = { de: "de_DE", en: "en_GB" };

/** Trim text to a search-snippet friendly length without cutting words. */
export function snippet(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[,;:–-]$/, "") + " …";
}

/**
 * Per-page metadata: canonical URL, hreflang alternates and social cards.
 * `path` is the locale-independent part, e.g. "/" or "/beitrag/f1-jaeger/".
 */
export function pageMetadata(
  lang: Locale,
  path: string,
  opts: { title?: string; description?: string; type?: "website" | "article" } = {}
): Metadata {
  const copy = t(lang);
  const description = opts.description ?? copy.metaDescription;
  const url = `/${lang}${path}`;
  const image = { url: `/og-${lang}.png`, width: 1200, height: 630, alt: copy.metaTitleDefault };
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    alternates: {
      canonical: url,
      languages: { de: `/de${path}`, en: `/en${path}`, "x-default": `/de${path}` },
    },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: "Industrietag Rems-Murr Praxisforum 2026",
      title: opts.title ?? copy.metaTitleDefault,
      description,
      locale: ogLocale[lang],
      alternateLocale: [ogLocale[lang === "de" ? "en" : "de"]],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title ?? copy.metaTitleDefault,
      description,
      images: [image.url],
    },
  };
}

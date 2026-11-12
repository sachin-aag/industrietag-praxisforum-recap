export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg === "en" ? "en" : "de";
}

/** Swap /de/... and /en/... while keeping the rest of the path (and trailing slash). */
export function switchLocalePath(pathname: string, next: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "de" || parts[0] === "en") {
    parts[0] = next;
  } else {
    parts.unshift(next);
  }
  return `/${parts.join("/")}/`;
}

/** Locale-prefixed href. `path` is '/', '/download/', '/beitrag/slug/', or '/#programm'. */
export function localizedPath(lang: Locale, path: string): string {
  if (path.startsWith("/#")) return `/${lang}/${path.slice(1)}`;
  if (path.startsWith("#")) return `/${lang}/${path}`;
  if (path === "/") return `/${lang}/`;
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${trimmed}`;
}

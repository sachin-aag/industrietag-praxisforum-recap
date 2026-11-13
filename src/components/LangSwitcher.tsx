"use client";

import { usePathname } from "next/navigation";
import { switchLocalePath, type Locale } from "@/i18n/config";

export function LangSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname() || `/${lang}/`;
  // Plain anchors: a full navigation guarantees <html lang> and all server-rendered copy switch together.
  const go = (next: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.assign(switchLocalePath(pathname, next) + window.location.hash);
  };
  return (
    <nav className="lang-switch" aria-label={label}>
      {(["de", "en"] as const).map((l) => (
        <a
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={lang === l ? "true" : undefined}
          onClick={go(l)}
        >
          {l === "de" ? "Deutsch" : "English"}
        </a>
      ))}
    </nav>
  );
}

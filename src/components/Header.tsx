"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath, switchLocalePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";

function LangSwitcher({ lang, pathname }: { lang: Locale; pathname: string }) {
  const copy = t(lang);
  const go = (next: Locale) => {
    const href = switchLocalePath(pathname, next);
    return href;
  };
  const onClick = (next: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;
    e.preventDefault();
    window.location.assign(go(next).replace(/\/$/, "/") + (hash.startsWith("#") ? hash : `#${hash}`));
  };
  return (
    <nav className="lang-switch" aria-label={copy.langSwitcherLabel}>
      <Link href={go("de")} aria-current={lang === "de" ? "page" : undefined} onClick={onClick("de")}>
        DE
      </Link>
      <span aria-hidden="true">|</span>
      <Link href={go("en")} aria-current={lang === "en" ? "page" : undefined} onClick={onClick("en")}>
        EN
      </Link>
    </nav>
  );
}

export function Header() {
  const pathname = usePathname() || "/";
  const lang = localeFromPath(pathname);
  const copy = t(lang);
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href={localizedPath(lang, "/")}>
          <img src="/logos/industrietag-logo-blue.svg" alt="Industrietag Rems-Murr" />
          <span>
            {copy.brandRecap}
            <br />
            {copy.brandRecapSub}
          </span>
        </Link>
        <div className="header-right">
          <nav>
            <Link href={localizedPath(lang, "/#programm")}>{copy.navProgramme}</Link>
            <Link href={localizedPath(lang, "/#galerie")}>{copy.navGallery}</Link>
            <Link href={localizedPath(lang, "/#erkenntnisse")}>{copy.navTakeaways}</Link>
            <Link href={localizedPath(lang, "/download/")}>{copy.navPdf}</Link>
          </nav>
          <LangSwitcher lang={lang} pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

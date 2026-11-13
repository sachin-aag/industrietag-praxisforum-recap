import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { LangSwitcher } from "./LangSwitcher";

export function Header({ lang }: { lang: Locale }) {
  const copy = t(lang);
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link className="brand" href={localizedPath(lang, "/")}>
          <img src="/logos/industrietag-logo-blue.svg" alt="Industrietag Rems-Murr" width={150} height={36} />
          <span className="brand-line">{copy.brandLine}</span>
        </Link>
        <nav className="main-nav" aria-label="Hauptnavigation">
          <Link href={localizedPath(lang, "/#programm")}>{copy.navProgramme}</Link>
          <Link href={localizedPath(lang, "/#erkenntnisse")}>{copy.navTakeaways}</Link>
          <Link href={localizedPath(lang, "/#bilder")}>{copy.navGallery}</Link>
          <Link href={localizedPath(lang, "/download/")}>{copy.navPdf}</Link>
        </nav>
        <LangSwitcher lang={lang} label={copy.langSwitcherLabel} />
      </div>
    </header>
  );
}

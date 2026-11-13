import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";

export function Footer({ lang }: { lang: Locale }) {
  const copy = t(lang);
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="logos">
          <a href="https://www.schetter.de/" rel="noreferrer">
            <img src="/logos/schetter-logo-white.svg" alt="Wilhelm Schetter GmbH Haustechnik" />
          </a>
          <a className="gc-mark" href="https://gamechangerz.io/" rel="noreferrer">
            <img src="/logos/gamechangerz-logo.svg" alt="" />
            <span>GAMECHANGERZ</span>
          </a>
        </div>
        <p className="footer-about">{copy.footerAbout}</p>
        <ul className="footer-links">
          <li>
            <a href="https://industrietag-rm.de/" rel="noreferrer">industrietag-rm.de</a>
          </li>
          <li>
            <a href="https://www.schetter.de/" rel="noreferrer">schetter.de</a>
          </li>
          <li>
            <a href="https://gamechangerz.io/" rel="noreferrer">gamechangerz.io</a>
          </li>
          <li>
            <Link href={localizedPath(lang, "/impressum/")}>{copy.imprintTitle}</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

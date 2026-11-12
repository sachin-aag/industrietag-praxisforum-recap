"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath } from "@/i18n/config";
import { t } from "@/i18n/ui";

export function Footer() {
  const pathname = usePathname() || "/";
  const lang = localeFromPath(pathname);
  const copy = t(lang);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="logos">
          <img src="/logos/schetter-logo-white.svg" alt="Wilhelm Schetter GmbH Haustechnik" />
          <img src="/logos/gamechangerz-logo.svg" alt="Gamechangerz UG" />
        </div>
        <div className="footer-grid">
          <p>{copy.footerAbout}</p>
          <p>
            <Link href={localizedPath(lang, "/impressum/")}>{copy.imprintTitle}</Link>
            {" · "}
            <a href="https://industrietag-rm.de/" rel="noreferrer">industrietag-rm.de</a>
            {" · "}
            <a href="https://www.schetter.de/" rel="noreferrer">schetter.de</a>
            {" · "}
            <a href="https://gamechangerz.io/" rel="noreferrer">gamechangerz.io</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

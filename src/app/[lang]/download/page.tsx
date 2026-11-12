import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { pdfHref } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const copy = isLocale(lang) ? t(lang) : t("de");
  return { title: copy.downloadTitle };
}

export default async function DownloadPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">{copy.downloadKicker}</p>
          <h1>{copy.downloadTitle}</h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap prose">
          <p>{copy.downloadIntro}</p>
          <p>
            <a className="btn" href={pdfHref(lang)} download>
              {copy.downloadButton}
            </a>
          </p>
          <p>
            <Link href={localizedPath(lang, "/")}>{copy.backHome}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

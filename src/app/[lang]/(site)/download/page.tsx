import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { pageMetadata } from "@/lib/seo";
import { pdfHref } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = isLocale(lang) ? lang : "de";
  const copy = t(l);
  return pageMetadata(l, "/download/", { title: copy.downloadTitle, description: copy.downloadIntro });
}

export default async function DownloadPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Link className="back" href={localizedPath(lang, "/")}>
            {copy.backHome}
          </Link>
          <h1>{copy.downloadTitle}</h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap download">
          <a className="pdf-thumb" href={pdfHref(lang)} download>
            <img src={lang === "en" ? "/pdf-cover-en.png" : "/pdf-cover.png"} alt="" width={420} height={594} />
          </a>
          <div className="prose">
            <p>{copy.downloadIntro}</p>
            <p>
              <a className="btn" href={pdfHref(lang)} download>
                {copy.downloadButton}
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

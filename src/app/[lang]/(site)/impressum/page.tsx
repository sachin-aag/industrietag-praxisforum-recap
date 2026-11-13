import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = isLocale(lang) ? lang : "de";
  const copy = t(l);
  return pageMetadata(l, "/impressum/", { title: copy.imprintTitle });
}

export default async function ImpressumPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const [before, after] = copy.imprintP2.split("industrietag-rm.de");
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <h1>{copy.imprintTitle}</h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap prose">
          <p>{copy.imprintP1}</p>
          <p>
            {before}
            <a href="https://industrietag-rm.de/">industrietag-rm.de</a>
            {after}
          </p>
          <p>
            {copy.imprintOrganiser}
            <br />
            Wilhelm Schetter GmbH Haustechnik
            <br />
            Endersbacher Straße 19, 71394 Kernen im Remstal
            <br />
            <a href="https://www.schetter.de/">www.schetter.de</a>
          </p>
        </div>
      </section>
    </>
  );
}

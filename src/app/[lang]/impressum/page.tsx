import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const copy = isLocale(lang) ? t(lang) : t("de");
  return { title: copy.imprintTitle };
}

export default async function ImpressumPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <h1>{copy.imprintTitle}</h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap prose">
          <p>{copy.imprintP1}</p>
          <p>
            {copy.imprintP2.split("industrietag-rm.de")[0]}
            <a href="https://industrietag-rm.de/">industrietag-rm.de</a>
            {copy.imprintP2.split("industrietag-rm.de")[1]}
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
    </main>
  );
}

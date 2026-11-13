import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { Horizon } from "@/components/Horizon";
import { Timetable } from "@/components/Timetable";
import { AudienceChart, TalkFigures } from "@/components/Infographics";
import {
  dateLabel,
  pdfHref,
  photosFor,
  subtitle,
  takeawayItems,
  timesFor,
  transcriptionNote,
} from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const times = timesFor(lang);
  const photos = photosFor(lang);
  const heroPhoto = photos.find((p) => p.file === "03-buehne-zukunft.webp")!;
  const galleryFiles = ["01-willkommen-buehne", "02-reachy-roboter", "06-live-demo-agent", "05-hello-new-world", "08-huber-vortrag", "11-alles-wird-anders"];
  const [leadPhoto, ...restPhotos] = galleryFiles.map((f) => photos.find((p) => p.file === `${f}.webp`)!);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-text">
          <h1>{subtitle(lang)}</h1>
          <p className="lede">{copy.lede}</p>
          <div className="actions">
            <Link className="btn" href={localizedPath(lang, "/#programm")}>
              {copy.ctaProgramme}
            </Link>
            <a className="btn btn-quiet" href={pdfHref(lang)} download>
              {copy.ctaPdf}
            </a>
          </div>
          </div>
          <figure className="hero-photo">
            <img src={`/photos/${heroPhoto.file}`} alt={heroPhoto.caption} width={1200} height={900} />
          </figure>
        </div>
        <Horizon />
        <div className="hero-facts">
          <dl className="wrap facts">
            <div>
              <dt>{copy.factDate}</dt>
              <dd>{dateLabel(lang)}</dd>
            </div>
            <div>
              <dt>{copy.factVenue}</dt>
              <dd>Bürgerhaus Kernen-Rommelshausen</dd>
            </div>
            <div>
              <dt>{copy.factProgramme}</dt>
              <dd>{times.programme}</dd>
            </div>
            <div>
              <dt>{copy.factHosts}</dt>
              <dd>{copy.hosts}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section section-numbers" id="zahlen" aria-labelledby="zahlen-h">
        <div className="wrap numbers">
          <div>
            <h2 id="zahlen-h">{copy.numbersHeading}</h2>
            <p className="numbers-intro">{copy.numbersIntro}</p>
            <AudienceChart lang={lang} />
          </div>
          <div>
            <h3 className="numbers-sub">{copy.figuresHeading}</h3>
            <TalkFigures lang={lang} />
          </div>
        </div>
      </section>

      <section className="section" id="programm" aria-labelledby="programm-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="programm-h">{copy.programmeHeading}</h2>
            <p>{copy.programmeIntro}</p>
          </div>
          <Timetable lang={lang} />
        </div>
      </section>

      <section className="section section-tint" id="erkenntnisse" aria-labelledby="erkenntnisse-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="erkenntnisse-h">{copy.takeawaysHeading}</h2>
            <p>{copy.takeawaysIntro}</p>
          </div>
          <ul className="takeaways">
            {takeawayItems(lang).map((item) => (
              <li key={item.head}>
                <h3>{item.head}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="bilder" aria-labelledby="bilder-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="bilder-h">{copy.galleryHeading}</h2>
            <p>{copy.galleryIntro}</p>
          </div>
          <div className="gallery">
            <figure className="gallery-lead">
              <img src={`/photos/${leadPhoto.file}`} alt={leadPhoto.caption} loading="lazy" />
              <figcaption>{leadPhoto.caption}</figcaption>
            </figure>
            {restPhotos.map((p) => (
              <figure key={p.file}>
                <img src={`/photos/${p.file}`} alt={p.caption} loading="lazy" />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="pdf-band" aria-labelledby="pdf-h">
        <div className="wrap pdf-band-inner">
          <div>
            <h2 id="pdf-h">{copy.pdfHeading}</h2>
            <p>{copy.pdfBody}</p>
          </div>
          <a className="btn" href={pdfHref(lang)} download>
            {copy.ctaPdfLong}
          </a>
        </div>
      </section>

      <section className="section section-small">
        <div className="wrap">
          <details className="method">
            <summary>{copy.methodHeading}</summary>
            <p>{transcriptionNote(lang)}</p>
          </details>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { data } from "@/lib/data";
import {
  localizedTalks,
  takeaways,
  transcriptionNote,
  timesFor,
  trackLabel,
  photosFor,
  pdfHref,
  summaryBadgeKey,
} from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const talks = localizedTalks(lang);
  const times = timesFor(lang);
  const photos = photosFor(lang);

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <p className="kicker">{copy.kicker}</p>
          <h1>{data.subtitle}</h1>
          <p className="lede">{copy.lede}</p>
          <div className="meta-row">
            <span className="chip">{data.venue}</span>
            <span className="chip">
              {copy.chipTalks} {times.programme}
            </span>
            <span className="chip">
              {copy.chipFair} {times.hausmesse}
            </span>
          </div>
          <div className="actions">
            <Link className="btn" href={localizedPath(lang, "/#programm")}>
              {copy.ctaProgramme}
            </Link>
            <Link className="btn ghost" href={localizedPath(lang, "/download/")}>
              {copy.ctaPdf}
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="programm">
        <div className="wrap">
          <h2>{copy.programmeHeading}</h2>
          <p>{copy.programmeIntro}</p>
          <div className="talk-list">
            {talks.map((talk, i) => {
              const showHead = i === 0 || talk.track !== talks[i - 1].track;
              const who = talk.speakers
                .map((s) => `${s.name}${s.company ? `, ${s.company}` : ""}`)
                .join(" · ");
              const badge = copy[summaryBadgeKey(talk)];
              const inner = (
                <>
                  <div className="time">
                    {talk.time}
                    {talk.time_end ? `–${talk.time_end}` : ""}
                  </div>
                  <div>
                    <h3>
                      {talk.label ? `${talk.label}: ` : ""}
                      {talk.title}
                    </h3>
                    {who ? <p className="who">{who}</p> : null}
                  </div>
                  <div className={`badge${talk.summary_status ? " unsicher" : ""}`}>{badge}</div>
                </>
              );
              return (
                <div key={talk.slug}>
                  {showHead ? (
                    <p className="track-head">
                      {trackLabel(lang, talk.track)}
                      {talk.track !== "hauptprogramm" ? ` · ${talk.room}` : ""}
                    </p>
                  ) : null}
                  {talk.type === "break" ? (
                    <div className="talk">{inner}</div>
                  ) : (
                    <Link className="talk" href={localizedPath(lang, `/beitrag/${talk.slug}/`)}>
                      {inner}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section alt" id="galerie">
        <div className="wrap">
          <h2>{copy.galleryHeading}</h2>
          <p>{copy.galleryIntro}</p>
          <div className="gallery">
            {photos.map((p) => (
              <figure key={p.file}>
                <img src={`/photos/${p.file}`} alt={p.caption} />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="erkenntnisse">
        <div className="wrap prose">
          <h2>{copy.takeawaysHeading}</h2>
          <p className="notice">{transcriptionNote(lang)}</p>
          <ul className="takeaways">
            {takeaways(lang).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 28 }}>
            <a className="btn" href={pdfHref(lang)} download>
              {copy.ctaPdfLong}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

// keep showCompanyLink import unused? remove it

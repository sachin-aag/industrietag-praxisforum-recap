import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "./print.css";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { Horizon } from "@/components/Horizon";
import { AudienceChart, PeakLoadChart, TalkFigures, ValveCostChart } from "@/components/Infographics";
import {
  dateLabel,
  localizedTalks,
  photosFor,
  photosForTalk,
  subtitle,
  summaryState,
  takeawayItems,
  talkTitle,
  timesFor,
  timetable,
  transcriptionNote,
  venue,
  type LocalizedTalk,
} from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

const who = (talk: LocalizedTalk) =>
  talk.speakers.map((s) => `${s.name}, ${s.company}`).join("; ");

function TalkBlock({ talk, lang }: { talk: LocalizedTalk; lang: Locale }) {
  const copy = t(lang);
  const state = summaryState(talk);
  return (
    <article className="p-talk">
      <p className="p-talk-time">
        {talk.time}–{talk.time_end}
        {copy.oClock}
      </p>
      <div>
        <h3>{talkTitle(talk)}</h3>
        {talk.speakers.length ? (
          <p className="p-talk-who">
            {talk.speakers.map((s, i) => (
              <span key={s.name}>
                {i > 0 ? "; " : ""}
                <strong>{s.name}</strong>
                {s.role ? `, ${s.role}` : ""}, {s.company}
              </span>
            ))}
          </p>
        ) : null}
        {talk.company_note ? <p className="p-note p-note-quiet">{talk.company_note}</p> : null}
        {state === "none" ? (
          <>
            {talk.company_note ? null : <p className="p-note">{copy.comingSoonBody}</p>}
            {talk.abstract ? <p className="p-abstract">{talk.abstract}</p> : null}
          </>
        ) : (
          <>
            {state !== "ok" ? (
              <p className="p-note">{state === "partial" ? copy.partlyUncertainBody : copy.uncertainBody}</p>
            ) : null}
            <ul className="p-points">
              {talk.summary_bullets!.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </>
        )}
        {talk.slug === "f1-jaeger" ? <div className="p-chart"><ValveCostChart lang={lang} /></div> : null}
        {talk.slug === "f2-helbig" ? <div className="p-chart"><PeakLoadChart lang={lang} /></div> : null}
        {talk.track === "hauptprogramm" && photosForTalk(talk.slug, lang)[0] ? (
          <figure className="p-talk-photo">
            <img src={`/photos/${photosForTalk(talk.slug, lang).at(-1)!.file.replace(".webp", ".jpg")}`} alt={photosForTalk(talk.slug, lang).at(-1)!.caption} />
            <figcaption>{photosForTalk(talk.slug, lang).at(-1)!.caption}</figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  );
}

export default async function PrintPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const talks = localizedTalks(lang).filter((x) => x.type !== "break");
  const rows = timetable(lang);
  const photos = photosFor(lang);
  const times = timesFor(lang);
  const pick = ["01-willkommen-buehne.webp", "03-buehne-zukunft.webp", "02-reachy-roboter.webp", "06-live-demo-agent.webp", "08-huber-vortrag.webp", "11-alles-wird-anders.webp"]
    .map((f) => photos.find((p) => p.file === f)!)
    .filter(Boolean);

  const sections: { track: string; items: LocalizedTalk[] }[] = [
    { track: "hauptprogramm", items: talks.filter((x) => x.track === "hauptprogramm" && x.slug !== "abschluss") },
    { track: "forum-1", items: talks.filter((x) => x.track === "forum-1") },
    { track: "forum-2", items: talks.filter((x) => x.track === "forum-2") },
  ];

  return (
    <div className="pdf" lang={lang}>
      {/* Cover */}
      <section className="p-cover">
        <div className="p-cover-top">
          <img src="/logos/industrietag-logo-blue.svg" alt="Industrietag Rems-Murr" />
          <span>Praxisforum 2026</span>
        </div>
        <div className="p-cover-body">
          <p className="p-cover-line">{copy.pdfCoverLine}</p>
          <h1>{subtitle(lang)}</h1>
          <figure className="p-cover-photo">
            <img src="/photos/03-buehne-zukunft.jpg" alt="" />
          </figure>
          <p className="p-cover-date">
            {dateLabel(lang)}
            <br />
            {venue(lang)}
          </p>
        </div>
        <Horizon id="pc" />
        <div className="p-cover-foot">
          <img src="/logos/schetter-logo-white.svg" alt="Wilhelm Schetter GmbH Haustechnik" />
          <span className="p-gc">
            <img src="/logos/gamechangerz-logo.svg" alt="" />
            GAMECHANGERZ
          </span>
        </div>
      </section>

      {/* Overview */}
      <section className="p-page">
        <h2>{copy.pdfContents}</h2>
        <p className="p-lede">{copy.lede}</p>
        <dl className="p-facts">
          <div>
            <dt>{copy.factProgramme}</dt>
            <dd>{times.programme}</dd>
          </div>
          <div>
            <dt>{copy.factFair}</dt>
            <dd>{times.hausmesse}</dd>
          </div>
          <div>
            <dt>{copy.factHosts}</dt>
            <dd>{copy.hosts}</dd>
          </div>
        </dl>
        <table className="p-tt">
          <tbody>
            {rows.map((row) =>
              row.kind === "main" ? (
                <tr key={row.time} className={row.talk.type === "break" ? "is-break" : undefined}>
                  <th scope="row">{row.time}</th>
                  <td colSpan={2}>
                    <strong>{talkTitle(row.talk)}</strong>
                    {row.talk.speakers.length ? <span>{who(row.talk)}</span> : null}
                  </td>
                </tr>
              ) : (
                <tr key={row.time} className="is-forum">
                  <th scope="row">{row.time}</th>
                  {[row.f1, row.f2].map((x, i) => (
                    <td key={i} className={i === 0 ? "f1" : "f2"}>
                      {x ? (
                        <>
                          <em>{copy.trackNames[i === 0 ? "forum-1" : "forum-2"]}</em>
                          <strong>{x.title}</strong>
                          <span>{who(x)}</span>
                        </>
                      ) : null}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>

      {/* Takeaways */}
      <section className="p-page p-takeaways">
        <h2>{copy.takeawaysHeading}</h2>
        <p className="p-lede">{copy.takeawaysIntro}</p>
        <ul>
          {takeawayItems(lang).map((item) => (
            <li key={item.head}>
              <h3>{item.head}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Numbers */}
      <section className="p-page p-numbers">
        <h2>{copy.numbersHeading}</h2>
        <p className="p-lede">{copy.numbersIntro}</p>
        <AudienceChart lang={lang} />
        <h2 className="p-sub">{copy.figuresHeading}</h2>
        <TalkFigures lang={lang} />
      </section>

      {/* Talks */}
      {sections.map((sec) => (
        <section className={`p-page p-track p-${sec.track}`} key={sec.track}>
          <header className="p-track-head">
            <h2>{copy.trackNames[sec.track as keyof typeof copy.trackNames]}</h2>
            <p>{copy.trackTopics[sec.track as keyof typeof copy.trackTopics]}</p>
          </header>
          {sec.items.map((talk) => (
            <TalkBlock key={talk.slug} talk={talk} lang={lang} />
          ))}
        </section>
      ))}

      {/* Photos + colophon */}
      <section className="p-page p-photos">
        <h2>{copy.galleryHeading}</h2>
        <div className="p-grid">
          {pick.map((p) => (
            <figure key={p.file}>
              <img src={`/photos/${p.file.replace(".webp", ".jpg")}`} alt={p.caption} />
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div className="p-colophon">
          <h3>{copy.methodHeading}</h3>
          <p>{transcriptionNote(lang)}</p>
          <p>
            {copy.pdfMore} industrietag-rm.de, schetter.de {lang === "en" ? "and" : "und"} gamechangerz.io
          </p>
        </div>
      </section>
    </div>
  );
}

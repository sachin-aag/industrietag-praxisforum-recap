import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { data, showCompanyLink, showLinkedIn } from "@/lib/data";
import { localizedTalk, photosForTalk, summaryState, talkTitle, trackLabel } from "@/lib/i18n";
import { PeakLoadChart, ValveCostChart } from "@/components/Infographics";
import { pageMetadata, snippet } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    data.talks.filter((talk) => talk.type !== "break").map((talk) => ({ lang, slug: talk.slug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const base = data.talks.find((item) => item.slug === slug);
  const l: Locale = isLocale(lang) ? lang : "de";
  if (!base) return { title: t(l).talkFallbackTitle };
  const talk = localizedTalk(base, l);
  const who = talk.speakers.map((s) => `${s.name} (${s.company})`).join(", ");
  const lead = talk.has_summary && talk.summary_bullets?.length ? talk.summary_bullets[0] : talk.abstract ?? "";
  const title = talk.label ? `${talk.label}: ${talk.title}` : talk.title;
  return pageMetadata(l, `/beitrag/${slug}/`, {
    title,
    description: snippet(`${who ? who + ": " : ""}${lead}`),
    type: "article",
  });
}

export default async function TalkPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const base = data.talks.find((item) => item.slug === slug);
  if (!base || base.type === "break") notFound();
  const talk = localizedTalk(base, lang);
  const linkable = data.talks.filter((item) => item.type !== "break");
  const i = linkable.findIndex((item) => item.slug === talk.slug);
  const prev = i > 0 ? localizedTalk(linkable[i - 1], lang) : null;
  const next = i < linkable.length - 1 ? localizedTalk(linkable[i + 1], lang) : null;
  const state = summaryState(talk);
  const photos = photosForTalk(talk.slug, lang);
  const chart =
    talk.slug === "f1-jaeger" ? <ValveCostChart lang={lang} /> : talk.slug === "f2-helbig" ? <PeakLoadChart lang={lang} /> : null;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Link className="back" href={localizedPath(lang, "/#programm")}>
            {copy.backToAll}
          </Link>
          <p className="page-meta">
            {talk.time}
            {talk.time_end ? `–${talk.time_end}` : ""}
            {copy.oClock}, {trackLabel(lang, talk.track).replace(" · ", ", ")}
          </p>
          <h1>{talkTitle(talk)}</h1>
        </div>
      </section>

      <div className="wrap talk-layout">
        <aside className="talk-aside" aria-label={copy.speakersHeading}>
          <h2 className="aside-h">{copy.speakersHeading}</h2>
          <ul className="speakers">
            {talk.speakers.map((s) => {
              const company = showCompanyLink(s.company);
              const li = showLinkedIn(s);
              return (
                <li className="speaker" key={s.name}>
                  <strong>{s.name}</strong>
                  {s.role ? <span>{s.role}</span> : null}
                  <span>{s.company}</span>
                  {li || company?.url ? (
                    <span className="speaker-links">
                      {li ? (
                        <a href={li} rel="noreferrer" target="_blank">
                          LinkedIn
                        </a>
                      ) : null}
                      {company?.url ? (
                        <a href={company.url} rel="noreferrer" target="_blank">
                          {copy.companyWebsite}
                        </a>
                      ) : null}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {talk.company_note && state !== "none" ? <p className="speaker-note">{talk.company_note}</p> : null}
        </aside>

        <article className="talk-main">
          <h2>{copy.summaryHeading}</h2>
          {state === "none" ? (
            <div className="note">
              <strong>{copy.comingSoonTitle}</strong>
              <p>{talk.company_note ?? copy.comingSoonBody}</p>
            </div>
          ) : (
            <>
              {state !== "ok" ? (
                <div className="note">
                  <strong>{state === "partial" ? copy.partlyUncertainTitle : copy.uncertainTitle}</strong>
                  <p>{state === "partial" ? copy.partlyUncertainBody : copy.uncertainBody}</p>
                </div>
              ) : null}
              <ul className="points">
                {talk.summary_bullets!.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          )}

          {chart}

          {photos.length ? (
            <div className={`talk-photos n${Math.min(photos.length, 3)}`}>
              {photos.slice(0, 3).map((p) => (
                <figure key={p.file}>
                  <img src={`/photos/${p.file}`} alt={p.caption} loading="lazy" />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {talk.abstract ? (
            <details className="abstract" open={state === "none"}>
              <summary>{copy.announcement}</summary>
              <p>{talk.abstract}</p>
              <p className="source">{copy.announcementSource}</p>
            </details>
          ) : null}

          <nav className="pager" aria-label={`${copy.prevTalk} / ${copy.nextTalk}`}>
            {prev ? (
              <Link className="pager-prev" href={localizedPath(lang, `/beitrag/${prev.slug}/`)}>
                <span>{copy.prevTalk}</span>
                {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="pager-next" href={localizedPath(lang, `/beitrag/${next.slug}/`)}>
                <span>{copy.nextTalk}</span>
                {next.title}
              </Link>
            ) : null}
          </nav>
        </article>
      </div>
    </>
  );
}

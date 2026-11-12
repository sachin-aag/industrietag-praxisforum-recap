import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales, localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { data, showCompanyLink, showLinkedIn } from "@/lib/data";
import { localizedTalk, transcriptionNote, trackLabel } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    data.talks.filter((talk) => talk.type !== "break").map((talk) => ({ lang, slug: talk.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const talk = data.talks.find((item) => item.slug === slug);
  const copy = isLocale(lang) ? t(lang) : t("de");
  return { title: talk?.title ?? copy.talkFallbackTitle };
}

export default async function TalkPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const lang = raw as Locale;
  const copy = t(lang);
  const base = data.talks.find((item) => item.slug === slug);
  if (!base || base.type === "break") notFound();
  const talk = localizedTalk(base, lang);
  const i = data.talks.findIndex((item) => item.slug === talk.slug);
  const prev = [...data.talks.slice(0, i)].reverse().find((item) => item.type !== "break");
  const next = data.talks.slice(i + 1).find((item) => item.type !== "break");

  const summaryState =
    talk.has_summary && talk.summary_bullets && talk.summary_bullets.length && !talk.summary_status
      ? "ok"
      : talk.has_summary && talk.summary_bullets?.length
        ? talk.summary_status === "teilweise unsicher"
          ? "partial"
          : "uncertain"
        : "none";

  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">
            {talk.time}
            {talk.time_end ? `–${talk.time_end}` : ""}
            {copy.oClock} · {trackLabel(lang, talk.track)} · {talk.room}
          </p>
          <h1>
            {talk.label ? `${talk.label}: ` : ""}
            {talk.title}
          </h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap prose">
          <p className="back">
            <Link href={localizedPath(lang, "/#programm")}>{copy.backToAll}</Link>
          </p>
          <div className="speakers">
            {talk.speakers.map((s) => {
              const company = showCompanyLink(s.company);
              const li = showLinkedIn(s);
              return (
                <div className="speaker" key={s.name}>
                  <strong>{s.name}</strong>
                  <span>
                    {s.role ? `${s.role}, ` : ""}
                    {s.company}
                  </span>
                  <div className="links">
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
                  </div>
                </div>
              );
            })}
          </div>
          {talk.company_note ? <p className="notice">{talk.company_note}</p> : null}
          {talk.abstract ? (
            <>
              <h2>{copy.announcement}</h2>
              <p>{talk.abstract}</p>
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>{copy.announcementSource}</p>
            </>
          ) : talk.abstract_note ? (
            <p className="notice">{talk.abstract_note}</p>
          ) : null}

          <h2>{copy.summaryHeading}</h2>
          {summaryState === "ok" ? (
            <>
              <ul className="bullets">
                {talk.summary_bullets!.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="notice">{transcriptionNote(lang)}</p>
            </>
          ) : summaryState === "uncertain" || summaryState === "partial" ? (
            <>
              <div className="placeholder">
                <strong>{summaryState === "partial" ? copy.partlyUncertainTitle : copy.uncertainTitle}</strong>
                {summaryState === "partial" ? copy.partlyUncertainBody : copy.uncertainBody}
              </div>
              <ul className="bullets">
                {talk.summary_bullets!.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="notice">{transcriptionNote(lang)}</p>
            </>
          ) : (
            <div className="placeholder">
              <strong>{copy.comingSoonTitle}</strong>
              {copy.comingSoonBody}
            </div>
          )}

          <p style={{ marginTop: 36, display: "flex", gap: 18, flexWrap: "wrap" }}>
            {prev ? (
              <Link href={localizedPath(lang, `/beitrag/${prev.slug}/`)}>
                ← {prev.time} {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={localizedPath(lang, `/beitrag/${next.slug}/`)}>
                {next.time} {next.title} →
              </Link>
            ) : null}
          </p>
        </div>
      </section>
    </main>
  );
}

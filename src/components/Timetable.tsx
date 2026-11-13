import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { summaryState, timetable, type LocalizedTalk } from "@/lib/i18n";

function Speakers({ talk }: { talk: LocalizedTalk }) {
  if (!talk.speakers.length) return null;
  return (
    <ul className="tt-who">
      {talk.speakers.map((s) => (
        <li key={s.name}>
          <span className="tt-name">{s.name}</span> <span className="tt-co">{s.company}</span>
        </li>
      ))}
    </ul>
  );
}

function Flag({ talk, lang }: { talk: LocalizedTalk; lang: Locale }) {
  const copy = t(lang);
  const state = summaryState(talk);
  if (state === "ok" || talk.type === "break") return null;
  const text =
    state === "uncertain" ? copy.uncertainShort : state === "partial" ? copy.partlyUncertainShort : copy.noSummaryShort;
  return <span className="tt-flag">{text}</span>;
}

function Cell({ talk, lang, forum }: { talk?: LocalizedTalk; lang: Locale; forum?: string }) {
  if (!talk) return <div className="tt-cell tt-empty" />;
  const body = (
    <>
      {forum ? <span className="tt-forum">{forum}</span> : null}
      {talk.label ? <span className="tt-label">{talk.label}</span> : null}
      <span className="tt-title">{talk.title}</span>
      <Speakers talk={talk} />
      <Flag talk={talk} lang={lang} />
    </>
  );
  if (talk.type === "break") return <div className="tt-cell tt-break">{body}</div>;
  return (
    <Link className="tt-cell" href={localizedPath(lang, `/beitrag/${talk.slug}/`)}>
      {body}
    </Link>
  );
}

export function Timetable({ lang }: { lang: Locale }) {
  const copy = t(lang);
  const rows = timetable(lang);
  const firstForum = rows.findIndex((r) => r.kind === "forums");
  const range = (talk?: LocalizedTalk) => (talk?.time_end ? `${talk.time}–${talk.time_end}` : talk?.time);

  return (
    <div className="tt" role="list">
      {rows.map((row, i) => (
        <div key={row.time} className={`tt-group${row.kind === "forums" ? " is-forums" : ""}`} role="listitem">
          {i === firstForum ? (
            <div className="tt-row tt-heads" aria-hidden="true">
              <div />
              <div className="tt-head tt-head-1">
                <strong>{copy.trackNames["forum-1"]}</strong>
                <span>{copy.trackTopics["forum-1"]}</span>
              </div>
              <div className="tt-head tt-head-2">
                <strong>{copy.trackNames["forum-2"]}</strong>
                <span>{copy.trackTopics["forum-2"]}</span>
              </div>
            </div>
          ) : null}
          {row.kind === "main" ? (
            <div className="tt-row">
              <div className="tt-time">{range(row.talk)}</div>
              <Cell talk={row.talk} lang={lang} />
            </div>
          ) : (
            <div className="tt-row">
              <div className="tt-time">{range(row.f1 ?? row.f2)}</div>
              <Cell talk={row.f1} lang={lang} forum={copy.trackNames["forum-1"]} />
              <Cell talk={row.f2} lang={lang} forum={copy.trackNames["forum-2"]} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { data, type Talk } from "./data";
import { photos as photoIndex } from "./photos";
import en from "@/i18n/en-content.json";

export type LocalizedTalk = Talk;

type EnTalk = {
  title?: string;
  label?: string;
  abstract?: string;
  abstract_note?: string;
  company_note?: string;
  summary_bullets?: string[];
};

const enTalks = en.talks as Record<string, EnTalk>;
const enRoles = (en as { roles?: Record<string, string> }).roles ?? {};

export function localizedTalk(talk: Talk, lang: Locale): LocalizedTalk {
  if (lang === "de") return talk;
  const overlay = enTalks[talk.slug] ?? {};
  return {
    ...talk,
    title: overlay.title ?? talk.title,
    label: overlay.label ?? talk.label,
    speakers: talk.speakers.map((s) => ({ ...s, role: s.role ? enRoles[s.role] ?? s.role : s.role })),
    abstract: overlay.abstract ?? talk.abstract,
    abstract_note: overlay.abstract_note ?? talk.abstract_note,
    company_note: overlay.company_note ?? talk.company_note,
    summary_bullets: overlay.summary_bullets ?? talk.summary_bullets,
  };
}

export function localizedTalks(lang: Locale): LocalizedTalk[] {
  return data.talks.map((talk) => localizedTalk(talk, lang));
}

export function talkTitle(talk: Talk): string {
  return talk.label ? `${talk.label}: ${talk.title}` : talk.title;
}

export function subtitle(lang: Locale): string {
  return lang === "en" ? en.subtitle : data.subtitle;
}

export function venue(lang: Locale): string {
  return lang === "en" ? en.venue : data.venue;
}

export function takeaways(lang: Locale): string[] {
  return lang === "en" ? en.takeaways : data.takeaways;
}

export function transcriptionNote(lang: Locale): string {
  return lang === "en" ? en.transcription_uncertainty : data.transcription_uncertainty;
}

export function dateLabel(lang: Locale): string {
  return lang === "en" ? en.date_label : data.date_label;
}

export function timesFor(lang: Locale): { hausmesse: string; programme: string; networking: string } {
  return lang === "en" ? en.times : data.times;
}

export function trackLabel(lang: Locale, track: string): string {
  const labels = t(lang).tracks as Record<string, string>;
  return labels[track] ?? track;
}

export function trackName(lang: Locale, track: string): string {
  const labels = t(lang).trackNames as Record<string, string>;
  return labels[track] ?? track;
}

export function photoCaption(file: string, lang: Locale): string {
  if (lang === "en") {
    const captions = en.photos as Record<string, string>;
    if (captions[file]) return captions[file];
  }
  return photoIndex.find((p) => p.file === file)?.caption ?? file;
}

export function photosFor(lang: Locale) {
  return photoIndex.map((p) => ({ ...p, caption: photoCaption(p.file, lang) }));
}

export function photosForTalk(slug: string, lang: Locale) {
  return photosFor(lang).filter((p) => p.talk === slug);
}

export function pdfHref(lang: Locale): string {
  return lang === "en" ? "/praxisforum-2026-recap-en.pdf" : "/praxisforum-2026-recap.pdf";
}

export type SummaryState = "ok" | "uncertain" | "partial" | "none";

export function summaryState(talk: Talk): SummaryState {
  if (!talk.has_summary || !talk.summary_bullets?.length) return "none";
  if (talk.summary_status === "unsicher") return "uncertain";
  if (talk.summary_status === "teilweise unsicher") return "partial";
  return "ok";
}

export type TimetableRow =
  | { kind: "main"; time: string; talk: LocalizedTalk }
  | { kind: "forums"; time: string; f1?: LocalizedTalk; f2?: LocalizedTalk };

/** Main programme as single rows; the two parallel forums paired by start time. */
export function timetable(lang: Locale): TimetableRow[] {
  const talks = localizedTalks(lang);
  const rows: TimetableRow[] = [];
  const forumRows = new Map<string, Extract<TimetableRow, { kind: "forums" }>>();
  for (const talk of talks) {
    if (talk.track === "hauptprogramm") {
      rows.push({ kind: "main", time: talk.time, talk });
      continue;
    }
    let row = forumRows.get(talk.time);
    if (!row) {
      row = { kind: "forums", time: talk.time };
      forumRows.set(talk.time, row);
      rows.push(row);
    }
    if (talk.track === "forum-1") row.f1 = talk;
    else row.f2 = talk;
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

export function takeawayItems(lang: Locale): { head: string; body: string }[] {
  const heads = (lang === "en" ? en.takeaway_heads : (data as { takeaway_heads?: string[] }).takeaway_heads) ?? [];
  return takeaways(lang).map((body, i) => ({ head: heads[i] ?? "", body }));
}

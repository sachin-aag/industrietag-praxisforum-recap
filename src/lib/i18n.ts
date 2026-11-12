import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { data, type Talk } from "./data";
import { photos as photoIndex } from "./photos";
import en from "@/i18n/en-content.json";

export type LocalizedTalk = Talk;

type EnTalk = {
  abstract?: string;
  abstract_note?: string;
  company_note?: string;
  summary_bullets?: string[];
};

const enTalks = en.talks as Record<string, EnTalk>;

export function localizedTalk(talk: Talk, lang: Locale): LocalizedTalk {
  if (lang === "de") return talk;
  const overlay = enTalks[talk.slug];
  if (!overlay) return talk;
  return {
    ...talk,
    abstract: overlay.abstract ?? talk.abstract,
    abstract_note: overlay.abstract_note ?? talk.abstract_note,
    company_note: overlay.company_note ?? talk.company_note,
    summary_bullets: overlay.summary_bullets ?? talk.summary_bullets,
  };
}

export function localizedTalks(lang: Locale): LocalizedTalk[] {
  return data.talks.map((talk) => localizedTalk(talk, lang));
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

export function pdfHref(lang: Locale): string {
  return lang === "en" ? "/praxisforum-2026-recap-en.pdf" : "/praxisforum-2026-recap.pdf";
}

export function summaryBadgeKey(
  talk: Talk
): "badgeSummary" | "badgePlaceholder" | "badgeUncertain" | "badgePartlyUncertain" {
  if (talk.summary_status === "unsicher") return "badgeUncertain";
  if (talk.summary_status === "teilweise unsicher") return "badgePartlyUncertain";
  return talk.has_summary ? "badgeSummary" : "badgePlaceholder";
}

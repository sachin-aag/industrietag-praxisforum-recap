import programme from "../data/programme.json";

export type LinkStatus = "from event site" | "verified" | "unverified/not found";

export type Person = {
  name: string;
  role?: string | null;
  company: string;
  linkedin?: { url?: string | null; status: string };
};

export type Talk = {
  slug: string;
  type: string;
  track: string;
  room: string;
  time: string;
  time_end?: string;
  title: string;
  label?: string;
  speakers: Person[];
  abstract?: string | null;
  abstract_note?: string;
  has_summary?: boolean;
  summary_bullets?: string[];
  summary_status?: string;
  company_note?: string;
};

export type Programme = {
  title: string;
  subtitle: string;
  date_label: string;
  venue: string;
  host: string;
  co_host: string;
  times: { hausmesse: string; programme: string; networking: string };
  website: string;
  transcription_uncertainty: string;
  companies: Record<string, { url?: string | null; status: string; note?: string; linkedin?: { url?: string | null; status: string } }>;
  talks: Talk[];
  takeaways: string[];
};

export const data = programme as Programme;

export const trackLabel: Record<string, string> = {
  "hauptprogramm": "Hauptprogramm · Saal 1",
  "forum-1": "Forum 1 · Planung, Daten und digitale Projektabwicklung",
  "forum-2": "Forum 2 · Ausführung, Gebäudetechnik und intelligenter Betrieb",
};

export function companyOf(name: string) {
  return data.companies[name];
}

export function showCompanyLink(name: string) {
  const c = data.companies[name];
  if (!c?.url) return null;
  if (c.status === "verified" || c.status === "from event site") return c;
  return null;
}

export function showLinkedIn(person: Person) {
  const s = person.linkedin;
  if (!s?.url) return null;
  if (s.status === "verified" || s.status === "from event site") return s.url;
  return null;
}

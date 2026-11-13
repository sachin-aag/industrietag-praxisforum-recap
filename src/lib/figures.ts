import type { Locale } from "@/i18n/config";

type L = Record<Locale, string>;

/** Guest mix as announced in the opening (approx. 400 registered guests). */
export const audience: { label: L; value: number }[] = [
  { label: { de: "Planung", en: "Planning" }, value: 140 },
  { label: { de: "Industrie", en: "Industry" }, value: 70 },
  { label: { de: "Bau und Handwerk", en: "Construction and trades" }, value: 70 },
  { label: { de: "Architektur", en: "Architecture" }, value: 40 },
  { label: { de: "Aussteller", en: "Exhibitors" }, value: 40 },
  { label: { de: "Wissenschaft, Verbände, Medien", en: "Science, associations, media" }, value: 40 },
];

/** Headline figures quoted in the talks, each linked to its talk. */
export const talkFigures: { value: L; text: L; slug: string; who: string }[] = [
  {
    value: { de: "26 von 50", en: "26 of 50" },
    text: { de: "gezielten E-Mails einer ersten Agenten-Kampagne führten zu einem Termin", en: "targeted emails from a first agent campaign led to a meeting" },
    slug: "impuls-2-aechtler",
    who: "Gamechangerz",
  },
  {
    value: { de: "−50 %", en: "−50%" },
    text: { de: "Stromverbrauch der Beleuchtung nach der LED-Umrüstung bei Brugger Magnetsysteme", en: "lighting electricity after the LED retrofit at Brugger Magnetsysteme" },
    slug: "f2-helbig",
    who: "Mondas",
  },
  {
    value: { de: "65 %", en: "65%" },
    text: { de: "des Wärmebedarfs einer Pflegeeinrichtung decken Wärmepumpen schon im ersten Sanierungsschritt", en: "of a care facility's heat demand is covered by heat pumps in the first refurbishment step" },
    slug: "f2-rauh",
    who: "Bosch",
  },
  {
    value: { de: "−15 %", en: "−15%" },
    text: { de: "Gesamtenergiekosten im Schnitt, wenn Erzeuger, Speicher und Verbraucher vorausschauend gesteuert werden", en: "total energy costs on average when generation, storage and consumption are controlled predictively" },
    slug: "f2-pfau",
    who: "Siemens",
  },
];

/** Jäger (EFG): one ball valve in the BIM model. */
export const valveCosts: { label: L; value: number }[] = [
  { label: { de: "Einkaufspreis des Bauteils", en: "Purchase price of the part" }, value: 13 },
  { label: { de: "Planungshonorar nach HOAI", en: "Design fee under HOAI" }, value: 7.8 },
  { label: { de: "Aufwand für die Modellierung", en: "Modelling effort" }, value: 40 },
];

/** Helbig (Mondas): grid draw at Brugger Magnetsysteme, in kW. */
export const peakLoad = { limit: 160, measured: 207, rated: 250 };

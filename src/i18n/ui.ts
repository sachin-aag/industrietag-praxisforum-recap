import type { Locale } from "./config";

export const ui = {
  de: {
    metaTitleDefault: "Praxisforum 2026 – Recap | KI in Planung, Bau und Gebäudebetrieb",
    metaTitleTemplate: "%s | Praxisforum 2026 Recap",
    metaDescription:
      "Recap des Industrietag Rems-Murr Praxisforum am 10. November 2026 im Bürgerhaus Kernen: Impulse, zwei Fachforen und Hausmesse rund um KI in Planung, Bau und Gebäudebetrieb.",
    brandRecap: "Praxisforum 2026",
    brandRecapSub: "Recap",
    navProgramme: "Programm",
    navGallery: "Galerie",
    navTakeaways: "Erkenntnisse",
    navPdf: "PDF",
    langSwitcherLabel: "Sprache",
    kicker: "Recap · 10. November 2026 · Kernen im Remstal",
    lede:
      "Das Industrietag Rems-Murr Praxisforum brachte Fach- und Führungskräfte aus Planung, Bau, Gebäudetechnik und Betrieb zusammen. Drei Impulse, 16 Praxisbeiträge in zwei Fachforen und eine ganztägige Hausmesse – veranstaltet von der Wilhelm Schetter GmbH Haustechnik mit Gamechangerz UG.",
    chipTalks: "Vorträge",
    chipFair: "Hausmesse",
    ctaProgramme: "Zum Programm",
    ctaPdf: "Recap als PDF",
    programmeHeading: "Programm und Beiträge",
    programmeIntro:
      "Alle Zeiten gemäß öffentlichem Programm. Hinter den verlinkten Beiträgen stehen Zusammenfassungen aus den Live-Transkripten – oder ein klar gekennzeichneter Platzhalter, wenn die Zuordnung unsicher ist oder ein Mitschnitt fehlt.",
    badgeSummary: "Zusammenfassung",
    badgePlaceholder: "Platzhalter",
    badgeUncertain: "Unsicher",
    badgePartlyUncertain: "Teilweise unsicher",
    galleryHeading: "Galerie",
    galleryIntro:
      "Auswahl aus den Vor-Ort-Fotos vom 10. November 2026 (Vormittag und Impulse im Saal 1). Weitere Aufnahmen aus den Fachforen, vom Publikum und vom Get-together fehlen noch.",
    takeawaysHeading: "Was über den Tag blieb",
    ctaPdfLong: "Den Recap als PDF herunterladen",
    backToAll: "← Alle Beiträge",
    companyWebsite: "Unternehmenswebsite",
    announcement: "Ankündigung",
    announcementSource: "Quelle: öffentliches Programm auf industrietag-rm.de bzw. Eventflyer.",
    summaryHeading: "Zusammenfassung",
    uncertainTitle: "Zuordnung unsicher – bitte prüfen",
    uncertainBody:
      "Die folgenden Punkte beruhen auf einer unsicheren Zuordnung des Transkripts zum Programmslot.",
    partlyUncertainTitle: "Zuordnung teilweise unsicher – bitte prüfen",
    partlyUncertainBody:
      "Die folgenden Punkte beruhen auf einer nur teilweise sicheren Zuordnung des Transkripts zum Programmslot.",
    comingSoonTitle: "Zusammenfassung folgt",
    comingSoonBody:
      "Für diesen Programmpunkt liegt noch keine belastbare, eindeutig zugeordnete Mitschrift vor.",
    oClock: " Uhr",
    talkFallbackTitle: "Beitrag",
    downloadKicker: "Download",
    downloadTitle: "Recap als PDF",
    downloadIntro:
      "Der Entwurf fasst Programm, Referierende und die Transkript-Zusammenfassungen in einem Dokument zusammen. Platzhalter und unsichere Zuordnungen sind gekennzeichnet. Das PDF ist ein Arbeitsstand, keine autorisierte Veröffentlichung des Veranstalters.",
    downloadButton: "PDF herunterladen",
    backHome: "← Zurück zur Übersicht",
    imprintTitle: "Impressum",
    imprintP1:
      "Diese Recap-Website ist ein privater Arbeitsstand und keine offizielle Veröffentlichung der Wilhelm Schetter GmbH Haustechnik oder von Gamechangerz UG.",
    imprintP2:
      "Programminhalte: industrietag-rm.de. Marken und Logos bleiben bei den jeweiligen Rechteinhabern. Fotos stammen aus dem Vor-Ort-Material des Recap-Projekts.",
    imprintOrganiser: "Veranstalter des Events:",
    footerAbout:
      "Eine Veranstaltung der Wilhelm Schetter GmbH Haustechnik, gemeinsam mit Gamechangerz UG. Recap-Seite auf Basis des öffentlichen Programms (industrietag-rm.de) und der Vor-Ort-Transkripte. Keine offizielle Seite des Veranstalters.",
    tracks: {
      hauptprogramm: "Hauptprogramm · Saal 1",
      "forum-1": "Forum 1 · Planung, Daten und digitale Projektabwicklung",
      "forum-2": "Forum 2 · Ausführung, Gebäudetechnik und intelligenter Betrieb",
    },
  },
  en: {
    metaTitleDefault: "Praxisforum 2026 – Recap | KI in Planung, Bau und Gebäudebetrieb",
    metaTitleTemplate: "%s | Praxisforum 2026 Recap",
    metaDescription:
      "Recap of the Industrietag Rems-Murr Praxisforum on 10 November 2026 at Bürgerhaus Kernen: keynotes, two specialist forums and a trade exhibition on AI in planning, construction and building operations.",
    brandRecap: "Praxisforum 2026",
    brandRecapSub: "Recap",
    navProgramme: "Programme",
    navGallery: "Gallery",
    navTakeaways: "Takeaways",
    navPdf: "PDF",
    langSwitcherLabel: "Language",
    kicker: "Recap · 10 November 2026 · Kernen im Remstal",
    lede:
      "The Industrietag Rems-Murr Praxisforum brought together specialists and executives from planning, construction, building services and operations. Three keynotes, 16 practice talks in two specialist forums and an all-day trade exhibition – hosted by Wilhelm Schetter GmbH Haustechnik with Gamechangerz UG.",
    chipTalks: "Talks",
    chipFair: "Trade exhibition",
    ctaProgramme: "To the programme",
    ctaPdf: "Recap as PDF",
    programmeHeading: "Programme and talks",
    programmeIntro:
      "All times follow the public programme. Linked talks have summaries drawn from the live transcripts – or a clearly marked placeholder where the match is uncertain or a recording is missing.",
    badgeSummary: "Summary",
    badgePlaceholder: "Placeholder",
    badgeUncertain: "Uncertain",
    badgePartlyUncertain: "Partly uncertain",
    galleryHeading: "Gallery",
    galleryIntro:
      "A selection of on-site photographs from 10 November 2026 (morning and keynotes in Saal 1). Further pictures from the specialist forums, the audience and the get-together are not yet available.",
    takeawaysHeading: "What stayed with us from the day",
    ctaPdfLong: "Download the recap as PDF",
    backToAll: "← All talks",
    companyWebsite: "Company website",
    announcement: "Announcement",
    announcementSource: "Source: public programme on industrietag-rm.de or the event flyer.",
    summaryHeading: "Summary",
    uncertainTitle: "Assignment uncertain – please check",
    uncertainBody:
      "The following points are based on an uncertain match of the transcript to the programme slot.",
    partlyUncertainTitle: "Assignment partly uncertain – please check",
    partlyUncertainBody:
      "The following points are based on only a partly certain match of the transcript to the programme slot.",
    comingSoonTitle: "Summary coming soon",
    comingSoonBody:
      "There is not yet a reliable, clearly attributed transcript for this programme item.",
    oClock: "",
    talkFallbackTitle: "Talk",
    downloadKicker: "Download",
    downloadTitle: "Recap as PDF",
    downloadIntro:
      "This draft brings together the programme, the speakers and the transcript summaries in one document. Placeholders and uncertain assignments are marked. The PDF is a working draft, not an authorised publication by the organiser.",
    downloadButton: "Download PDF",
    backHome: "← Back to the overview",
    imprintTitle: "Legal notice",
    imprintP1:
      "This recap website is a private working draft and not an official publication of Wilhelm Schetter GmbH Haustechnik or Gamechangerz UG.",
    imprintP2:
      "Programme content: industrietag-rm.de. Brands and logos remain with their respective rights holders. Photographs come from on-site material of the recap project.",
    imprintOrganiser: "Event organiser:",
    footerAbout:
      "An event by Wilhelm Schetter GmbH Haustechnik, together with Gamechangerz UG. Recap site based on the public programme (industrietag-rm.de) and the on-site transcripts. Not an official site of the organiser.",
    tracks: {
      hauptprogramm: "Main programme · Saal 1",
      "forum-1": "Forum 1 · Planning, data and digital project delivery",
      "forum-2": "Forum 2 · Execution, building services and intelligent operations",
    },
  },
} as const;

export type UiDict = (typeof ui)[Locale];

export function t(lang: Locale): UiDict {
  return ui[lang];
}

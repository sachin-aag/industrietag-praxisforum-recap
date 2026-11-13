import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/config";
import { audience, peakLoad, talkFigures, valveCosts } from "@/lib/figures";

const nf = (lang: Locale, n: number, digits = 0) =>
  n.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Horizontal single-hue bars; every bar carries its value as text. */
function Bars({
  rows,
  max,
  format,
  caption,
  highlight,
}: {
  rows: { label: string; value: number }[];
  max: number;
  format: (n: number) => string;
  caption: string;
  highlight?: number;
}) {
  return (
    <figure className="bars">
      <ul>
        {rows.map((r, i) => (
          <li key={r.label} title={`${r.label}: ${format(r.value)}`}>
            <span className="bars-label">{r.label}</span>
            <span className="bars-track">
              <span
                className={`bars-fill${highlight === i ? " is-hi" : ""}`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="bars-value">{format(r.value)}</span>
          </li>
        ))}
      </ul>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function AudienceChart({ lang }: { lang: Locale }) {
  const rows = audience.map((a) => ({ label: a.label[lang], value: a.value }));
  return (
    <Bars
      rows={rows}
      max={140}
      format={(n) => `${lang === "de" ? "ca." : "approx."} ${nf(lang, n)}`}
      caption={
        lang === "de"
          ? "Rund 400 Gäste aus mehr als 270 Unternehmen, Angaben laut Begrüßung."
          : "Around 400 guests from more than 270 companies, as announced in the welcome."
      }
    />
  );
}

export function TalkFigures({ lang }: { lang: Locale }) {
  return (
    <ul className="figures">
      {talkFigures.map((f) => (
        <li key={f.slug}>
          <Link href={localizedPath(lang, `/beitrag/${f.slug}/`)}>
            <strong>{f.value[lang]}</strong>
            <span>{f.text[lang]}</span>
            <em>{f.who}</em>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ValveCostChart({ lang }: { lang: Locale }) {
  return (
    <Bars
      rows={valveCosts.map((v) => ({ label: v.label[lang], value: v.value }))}
      max={40}
      highlight={2}
      format={(n) => `${nf(lang, n, n % 1 ? 2 : 0)} €`}
      caption={
        lang === "de"
          ? "Ein Kugelhahn mit 122 Attributen im BIM-Modell: Die Modellierung kostet mehr als Bauteil und Honorar zusammen."
          : "One ball valve with 122 attributes in the BIM model: modelling costs more than the part and the fee combined."
      }
    />
  );
}

export function PeakLoadChart({ lang }: { lang: Locale }) {
  const { limit, measured, rated } = peakLoad;
  const pct = (n: number) => `${(n / rated) * 100}%`;
  const de = lang === "de";
  return (
    <figure className="peak">
      <div className="peak-scale" role="img" aria-label={de ? `Spitzenlast ${measured} kW, Grenze ${limit} kW, Trafo ${rated} kW` : `Peak load ${measured} kW, limit ${limit} kW, transformer ${rated} kW`}>
        <span className="peak-fill" style={{ width: pct(measured) }} />
        <span className="peak-limit" style={{ left: pct(limit) }} />
      </div>
      <dl className="peak-legend">
        <div>
          <dt>{de ? "Selbst gesetzte Grenze" : "Self-imposed limit"}</dt>
          <dd>{limit} kW</dd>
        </div>
        <div className="is-over">
          <dt>{de ? "Gemessene Spitze" : "Measured peak"}</dt>
          <dd>
            {measured} kW <span>{de ? "▲ über der Grenze" : "▲ above the limit"}</span>
          </dd>
        </div>
        <div>
          <dt>{de ? "Zulässig für den Trafo" : "Transformer rating"}</dt>
          <dd>{rated} kW</dd>
        </div>
      </dl>
      <figcaption>
        {de
          ? "Die „Lastspitzenampel“ bei Brugger Magnetsysteme meldet, wenn der Netzbezug die Grenze überschreitet."
          : "The “peak-load traffic light” at Brugger Magnetsysteme flags when grid draw exceeds the limit."}
      </figcaption>
    </figure>
  );
}

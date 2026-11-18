"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

const STEPS = [
  { id: "read", de: "Lese die Frage …", en: "Reading your question …" },
  { id: "search", de: "Durchsuche die Mitschnitte …", en: "Looking up the recordings …" },
  { id: "match", de: "Prüfe Vorträge und Referierende …", en: "Checking talks and speakers …" },
  { id: "think", de: "Ordne die Gedanken …", en: "Putting the pieces together …" },
  { id: "write", de: "Formuliere die Antwort …", en: "Writing the answer …" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const DWELL_MS = [750, 1700, 1500, 1900, 2600];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function ThinkingStatus({ lang, fallback }: { lang: Locale; fallback: string }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      if (i >= STEPS.length - 1) return;
      const jitter = 0.85 + Math.random() * 0.3;
      timer = setTimeout(() => {
        i += 1;
        setStep(i);
        schedule();
      }, DWELL_MS[i] * jitter);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduced]);

  if (reduced) {
    return (
      <div className="chat-think" role="status">
        <div className="chat-think-icon is-search" aria-hidden="true">
          <Scene step="search" />
        </div>
        <p className="chat-think-label">{fallback}</p>
      </div>
    );
  }

  const current = STEPS[step];
  const label = current[lang];

  return (
    <div className="chat-think" role="status" aria-live="polite" aria-label={label}>
      <div key={current.id} className={`chat-think-icon is-${current.id}`} aria-hidden="true">
        <Scene step={current.id} />
      </div>
      <div className="chat-think-copy">
        <p key={current.id} className="chat-think-label">
          {label}
        </p>
        <ol className="chat-think-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < step ? "is-done" : i === step ? "is-now" : ""} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function Scene({ step }: { step: StepId }) {
  switch (step) {
    case "read":
      return <SceneRead />;
    case "search":
      return <SceneSearch />;
    case "match":
      return <SceneMatch />;
    case "think":
      return <SceneThink />;
    case "write":
      return <SceneWrite />;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

function SceneRead() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28">
      <rect x="10" y="7" width="20" height="26" rx="3" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
      <path className="think-line l1" d="M14 15h12" />
      <path className="think-line l2" d="M14 20h12" />
      <path className="think-line l3" d="M14 25h8" />
    </svg>
  );
}

function SceneSearch() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28">
      <rect className="think-page back" x="7" y="11" width="15" height="19" rx="2" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
      <rect className="think-page front" x="12" y="8" width="15" height="19" rx="2" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
      <path className="think-page-line" d="M15 14h9M15 18h7" />
      <g className="think-glass">
        <circle cx="24" cy="23" r="6.2" fill="rgba(255,255,255,.45)" stroke="currentColor" strokeWidth="1.8" />
        <path d="M28.6 27.8 33 32.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SceneMatch() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28">
      <rect x="8" y="9" width="24" height="6.2" rx="1.6" fill="#fff" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="17" width="24" height="6.2" rx="1.6" fill="#fff" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="25" width="24" height="6.2" rx="1.6" fill="#fff" stroke="currentColor" strokeWidth="1.3" />
      <rect className="think-hi" x="8" y="9" width="24" height="6.2" rx="1.6" />
    </svg>
  );
}

function SceneThink() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28">
      <circle className="think-glow" cx="20" cy="18" r="9" />
      <circle className="think-core" cx="20" cy="18" r="5.2" />
      <circle className="think-spark s1" cx="31" cy="10" r="1.6" />
      <circle className="think-spark s2" cx="9" cy="12" r="1.2" />
      <circle className="think-spark s3" cx="30" cy="26" r="1.3" />
      <circle className="think-dot d1" cx="14" cy="32" r="1.7" />
      <circle className="think-dot d2" cx="20" cy="32" r="1.7" />
      <circle className="think-dot d3" cx="26" cy="32" r="1.7" />
    </svg>
  );
}

function SceneWrite() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28">
      <path className="think-ink" d="M8 31c4-5 8 1 12-3 4-4 7 2 12-2" fill="none" />
      <g className="think-pencil">
        <path d="M22.2 8.4 31.6 17.8 18.4 31h-5.2l.6-5.3Z" fill="#fff" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M22.2 8.4 25 5.6c.8-.8 2-.8 2.8 0l2.6 2.6c.8.8.8 2 0 2.8l-2.8 2.8" fill="currentColor" />
        <path d="M13.2 25.7 18.4 31" stroke="currentColor" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

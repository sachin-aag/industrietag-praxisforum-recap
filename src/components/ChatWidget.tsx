"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "loading" | "anon" | "sent" | "chat";

const T = {
  de: {
    open: "Fragen zum Praxisforum",
    title: "Praxisforum-Assistent",
    close: "Schließen",
    loginTitle: "Nur für Teilnehmende",
    loginBody: "Melden Sie sich mit der E-Mail-Adresse an, mit der Sie sich zum Praxisforum registriert haben. Wir schicken Ihnen einen Login-Link.",
    emailLabel: "E-Mail-Adresse",
    send: "Login-Link senden",
    sending: "Wird gesendet …",
    sentTitle: "Prüfen Sie Ihr Postfach",
    sentBody: (e: string) => `Wenn ${e} als Teilnehmende registriert ist, ist ein Login-Link unterwegs. Er ist 20 Minuten gültig.`,
    again: "Andere Adresse verwenden",
    expired: "Der Login-Link ist abgelaufen oder ungültig. Fordern Sie einfach einen neuen an.",
    errSend: "Die E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
    errRate: "Zu viele Versuche. Bitte warten Sie einige Minuten.",
    errInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    hello: "Fragen Sie mich zu Vorträgen, Referierenden und Inhalten des Praxisforums vom 10. November 2026.",
    suggestions: ["Was waren die wichtigsten Erkenntnisse des Tages?", "Was hat Hilti zum Bohrroboter gezeigt?", "In welchen Vorträgen ging es um Energiedaten?"],
    placeholder: "Ihre Frage zum Event …",
    ask: "Senden",
    thinking: "Einen Moment …",
    errChat: "Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.",
    errChatRate: "Sie haben viele Fragen gestellt. Bitte versuchen Sie es in einer Weile erneut.",
    errQuota: "Sie haben Ihr Kontingent an Fragen aufgebraucht. Vielen Dank fürs Nutzen des Assistenten!",
    errUnavailable: "Der Assistent ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut.",
    left: (n: number) => (n === 1 ? "Noch 1 Frage" : `Noch ${n} Fragen`),
    signedIn: "Angemeldet als",
    logout: "Abmelden",
    disclaimer: "Antworten beruhen auf automatischen Mitschnitten und können Fehler enthalten.",
  },
  en: {
    open: "Ask about the Praxisforum",
    title: "Praxisforum assistant",
    close: "Close",
    loginTitle: "For attendees only",
    loginBody: "Sign in with the email address you used to register for the Praxisforum. We'll send you a sign-in link.",
    emailLabel: "Email address",
    send: "Send sign-in link",
    sending: "Sending …",
    sentTitle: "Check your inbox",
    sentBody: (e: string) => `If ${e} is registered as an attendee, a sign-in link is on its way. It is valid for 20 minutes.`,
    again: "Use a different address",
    expired: "The sign-in link has expired or is invalid. Just request a new one.",
    errSend: "The email could not be sent. Please try again later.",
    errRate: "Too many attempts. Please wait a few minutes.",
    errInvalid: "Please enter a valid email address.",
    hello: "Ask me about the talks, speakers and content of the Praxisforum on 10 November 2026.",
    suggestions: ["What were the key takeaways of the day?", "What did Hilti show about the drilling robot?", "Which talks covered energy data?"],
    placeholder: "Your question about the event …",
    ask: "Send",
    thinking: "One moment …",
    errChat: "That didn't work. Please try again.",
    errChatRate: "You've asked a lot of questions. Please try again in a while.",
    errQuota: "You've used up your question allowance. Thanks for using the assistant!",
    errUnavailable: "The assistant is unavailable right now. Please try again later.",
    left: (n: number) => (n === 1 ? "1 question left" : `${n} questions left`),
    signedIn: "Signed in as",
    logout: "Sign out",
    disclaimer: "Answers are based on automatic recordings and may contain errors.",
  },
};

/** Minimal, safe rendering: paragraphs, "- " lists, **bold** and [text](/internal/link). */
function Rich({ text }: { text: string }) {
  const inline = (s: string, key: string) => {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\((\/[^)\s]*)\)|\*\*([^*]+)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      if (m[1]) parts.push(<a key={`${key}-${i++}`} href={m[2]}>{m[1]}</a>);
      else parts.push(<strong key={`${key}-${i++}`}>{m[3]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  };
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{lines.flatMap((l, li) => (li ? [<br key={`br${li}`} />, ...inline(l, `${bi}-${li}`)] : inline(l, `${bi}-${li}`)))}</p>;
      })}
    </>
  );
}

export function ChatWidget({ lang }: { lang: Locale }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshUser = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me/", { cache: "no-store" });
      const j = (await r.json()) as { user: { email: string } | null; questionsLeft: number | null };
      setUser(j.user?.email ?? null);
      setLeft(j.questionsLeft);
      setPhase(j.user ? "chat" : "anon");
    } catch {
      setPhase("anon");
    }
  }, []);

  // Open automatically after following the magic link (?chat=open) or on an expired link.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const flag = p.get("chat");
    if (flag) {
      setOpen(true);
      if (flag === "expired") setNotice(t.expired);
      p.delete("chat");
      const q = p.toString();
      window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : "") + window.location.hash);
    }
    try {
      const saved = sessionStorage.getItem("pf-chat");
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* storage unavailable */
    }
  }, [t.expired]);

  useEffect(() => {
    if (open && phase === "loading") refreshUser();
  }, [open, phase, refreshUser]);

  useEffect(() => {
    try {
      sessionStorage.setItem("pf-chat", JSON.stringify(messages.slice(-20)));
    } catch {
      /* storage unavailable */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    if (phase === "chat") inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      if (r.ok) setPhase("sent");
      else setNotice(r.status === 429 ? t.errRate : r.status === 400 ? t.errInvalid : t.errSend);
    } catch {
      setNotice(t.errSend);
    } finally {
      setBusy(false);
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      if (r.status === 401) {
        setMessages(next.slice(0, -1));
        setPhase("anon");
        return;
      }
      if (r.status === 429 && r.headers.get("X-Quota") === "exhausted") {
        setLeft(0);
        throw new Error("quota");
      }
      if (!r.ok || !r.body) throw new Error(String(r.status));
      const leftHeader = r.headers.get("X-Questions-Left");
      if (leftHeader !== null) setLeft(Number(leftHeader));
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) throw new Error("empty");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const text = code === "quota" ? t.errQuota : code === "429" ? t.errChatRate : code === "503" ? t.errUnavailable : t.errChat;
      setMessages([...next, { role: "assistant", content: text }]);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" }).catch(() => {});
    setUser(null);
    setMessages([]);
    setPhase("anon");
  }

  return (
    <div className="chat-root" lang={lang}>
      {open ? (
        <div className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title" ref={panelRef}>
          <header className="chat-head">
            <div>
              <h2 id="chat-title">{t.title}</h2>
              {phase === "chat" && user ? (
                <p>
                  {t.signedIn} {user} ·{" "}
                  <button type="button" className="chat-link" onClick={logout}>
                    {t.logout}
                  </button>
                </p>
              ) : null}
            </div>
            <button type="button" className="chat-x" onClick={() => setOpen(false)} aria-label={t.close}>
              ×
            </button>
          </header>

          {phase === "loading" ? <div className="chat-body chat-center">{t.thinking}</div> : null}

          {phase === "anon" ? (
            <form className="chat-body chat-login" onSubmit={requestLink}>
              <h3>{t.loginTitle}</h3>
              <p>{t.loginBody}</p>
              {notice ? <p className="chat-notice" role="alert">{notice}</p> : null}
              <label htmlFor="chat-email">{t.emailLabel}</label>
              <input
                id="chat-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="chat-btn" type="submit" disabled={busy}>
                {busy ? t.sending : t.send}
              </button>
            </form>
          ) : null}

          {phase === "sent" ? (
            <div className="chat-body chat-login">
              <h3>{t.sentTitle}</h3>
              <p>{t.sentBody(email)}</p>
              <button type="button" className="chat-link" onClick={() => setPhase("anon")}>
                {t.again}
              </button>
            </div>
          ) : null}

          {phase === "chat" ? (
            <>
              <div className="chat-body chat-list" ref={listRef} aria-live="polite">
                {messages.length === 0 ? (
                  <div className="chat-hello">
                    <p>{t.hello}</p>
                    <ul>
                      {t.suggestions.map((s) => (
                        <li key={s}>
                          <button type="button" onClick={() => ask(s)} disabled={left === 0}>
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`chat-msg is-${m.role}`}>
                      {m.role === "assistant" ? (m.content ? <Rich text={m.content} /> : <p className="chat-typing">{t.thinking}</p>) : <p>{m.content}</p>}
                    </div>
                  ))
                )}
              </div>
              <form
                className="chat-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  maxLength={2000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask(input);
                    }
                  }}
                />
                <button className="chat-btn" type="submit" disabled={busy || !input.trim() || left === 0}>
                  {t.ask}
                </button>
              </form>
              <p className="chat-foot">
                {left !== null ? <strong>{t.left(left)}. </strong> : null}
                {t.disclaimer}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className={`chat-fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t.close : t.open}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4.5 3.6A.6.6 0 0 1 3.5 21V18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 6.5a1.5 1.5 0 1 0 0 .01Zm5 0a1.5 1.5 0 1 0 0 .01Zm5 0a1.5 1.5 0 1 0 0 .01Z"
          />
        </svg>
        <span>{open ? t.close : t.open}</span>
      </button>
    </div>
  );
}

import "server-only";
import { normalizeEmail } from "./email";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  authSecret: () => new TextEncoder().encode(req("AUTH_SECRET")),
  knowledgeKey: () => Buffer.from(req("KNOWLEDGE_KEY"), "base64"),
  resendKey: () => req("RESEND_API_KEY"),
  /** e.g. "Praxisforum 2026 <praxisforum@yourdomain.de>" – must be a verified Resend sender. */
  mailFrom: () => req("AUTH_EMAIL_FROM"),
  openrouterKey: () => req("OPENROUTER_API_KEY"),
  /** OpenRouter model slug. Override with OPENROUTER_MODEL (e.g. in Vercel env). */
  model: () => process.env.OPENROUTER_MODEL || "google/gemini-3.6-flash",
  /**
   * Combined cap for hidden reasoning + visible answer. Gemini 3.x thinking
   * counts against this; 900 was not enough and cut replies mid-sentence.
   */
  maxOutputTokens: () => {
    const n = Number(process.env.OPENROUTER_MAX_TOKENS);
    return Number.isFinite(n) && n >= 256 ? Math.min(Math.floor(n), 8192) : 4096;
  },
  /**
   * Gemini 3.x defaults to medium thinking. Low is enough for grounded recap Q&A
   * and leaves room under maxOutputTokens for the actual answer.
   */
  reasoningEffort: (): "minimal" | "low" | "medium" | "high" | "none" => {
    const v = process.env.OPENROUTER_REASONING_EFFORT;
    switch (v) {
      case "minimal":
      case "low":
      case "medium":
      case "high":
      case "none":
        return v;
      default:
        return "low";
    }
  },
  /** Public origin used in magic links, e.g. https://recap.example.de (falls back to the request origin). */
  siteUrl: () => process.env.SITE_URL?.replace(/\/$/, ""),
  /** Comma- or newline-separated list of registered attendees. Kept out of the (public) repo. */
  allowedEmails: () =>
    new Set(
      (process.env.ALLOWED_EMAILS ?? "")
        .split(/[,\n;]/)
        .map((e) => normalizeEmail(e))
        .filter(Boolean)
    ),
};

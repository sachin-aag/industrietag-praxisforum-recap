import "server-only";

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
  model: () => process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free",
  /** Public origin used in magic links, e.g. https://recap.example.de (falls back to the request origin). */
  siteUrl: () => process.env.SITE_URL?.replace(/\/$/, ""),
  /** Comma- or newline-separated list of registered attendees. Kept out of the (public) repo. */
  allowedEmails: () =>
    new Set(
      (process.env.ALLOWED_EMAILS ?? "")
        .split(/[,\n;]/)
        .map((e) => e.trim().replace(/^<|>$/g, "").toLowerCase())
        .filter(Boolean)
    ),
};

import { NextResponse } from "next/server";
import { createLoginToken, isAllowed, normalizeEmail } from "@/server/auth";
import { sendMagicLink } from "@/server/mail";
import { env } from "@/server/env";
import { hit } from "@/server/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; lang?: string };
  const email = normalizeEmail(String(body.email ?? ""));
  const lang = body.lang === "en" ? "en" : "de";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!hit(`login:${email}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  // Only registered attendees get a link. The response is identical either way, so the endpoint
  // can't be used to find out who is on the list.
  if (await isAllowed(email)) {
    const origin = env.siteUrl() ?? new URL(req.url).origin;
    const token = await createLoginToken(email, lang);
    try {
      await sendMagicLink(email, `${origin}/api/auth/verify/?token=${encodeURIComponent(token)}`, lang);
    } catch (err) {
      console.error("[auth] magic link failed", err);
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}

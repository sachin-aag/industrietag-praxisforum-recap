import { NextResponse } from "next/server";
import { createSession, isAllowed, verifyLoginToken } from "@/server/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  try {
    const { email, lang } = await verifyLoginToken(token);
    if (!isAllowed(email)) throw new Error("not allowed");
    await createSession(email);
    return NextResponse.redirect(new URL(`/${lang}/?chat=open`, url.origin));
  } catch {
    return NextResponse.redirect(new URL(`/de/?chat=expired`, url.origin));
  }
}

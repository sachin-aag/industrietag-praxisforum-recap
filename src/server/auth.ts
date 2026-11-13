import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

export const SESSION_COOKIE = "pf_session";
const SESSION_DAYS = 30;
const LINK_MINUTES = 20;

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export function isAllowed(email: string) {
  return env.allowedEmails().has(normalizeEmail(email));
}

export async function createLoginToken(email: string, lang: string) {
  return new SignJWT({ email: normalizeEmail(email), lang, purpose: "login" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${LINK_MINUTES}m`)
    .sign(env.authSecret());
}

export async function verifyLoginToken(token: string) {
  const { payload } = await jwtVerify(token, env.authSecret(), { algorithms: ["HS256"] });
  if (payload.purpose !== "login" || typeof payload.email !== "string") throw new Error("bad token");
  return { email: payload.email, lang: payload.lang === "en" ? "en" : "de" };
}

export async function createSession(email: string) {
  const jwt = await new SignJWT({ email: normalizeEmail(email), purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(env.authSecret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

/** Returns the signed-in attendee, or null. Re-checks the allowlist so removing an address revokes access. */
export async function currentUser(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, env.authSecret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "session" || typeof payload.email !== "string") return null;
    if (!isAllowed(payload.email)) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

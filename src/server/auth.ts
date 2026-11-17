import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import { isAllowed, normalizeEmail } from "./allowlist";

export { isAllowed, normalizeEmail };

export const SESSION_COOKIE = "pf_session";
const LINK_MINUTES = 20;

/** Attendee session length after magic-link sign-in (default 6 hours). */
export function sessionHours(): number {
  const n = Number(process.env.AUTH_SESSION_HOURS);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 24 * 30) : 6;
}

const cookieOpts = () =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionHours() * 3600,
  });

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
  const hours = sessionHours();
  const jwt = await new SignJWT({ email: normalizeEmail(email), purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(env.authSecret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, cookieOpts());
}

/** Re-issues the session cookie so reloads within the window stay signed in (sliding idle timeout). */
export async function touchSession(email: string) {
  await createSession(email);
}

/** Returns the signed-in attendee, or null. Re-checks the allowlist so removing an address revokes access. */
export async function currentUser(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, env.authSecret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "session" || typeof payload.email !== "string") return null;
    if (!(await isAllowed(payload.email))) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...cookieOpts(), maxAge: 0 });
  jar.delete(SESSION_COOKIE);
}

// Manage the attendee allowlist in Upstash Redis.
//
//   npm run allowlist -- list
//   npm run allowlist -- add a@example.com b@example.com
//   npm run allowlist -- remove a@example.com
//   npm run allowlist -- import guests.csv      (adds every email address found in the file)
//   npm run allowlist -- usage                  (questions/tokens used per attendee)
//
// Credentials: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/_TOKEN), read from the
// environment or from .env.vercel.local / .env.local (get them with: vercel env pull .env.vercel.local).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KEY = "pf:allowlist";
const root = fileURLToPath(new URL("..", import.meta.url));

function loadEnv() {
  for (const f of [".env.vercel.local", ".env.local"]) {
    const p = root + f;
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const pick = (...names) => names.map((n) => process.env[n]).find(Boolean);
const url = pick("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL", "SCHETTER_KV_REST_API_URL");
const token = pick("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN", "SCHETTER_KV_REST_API_TOKEN");
if (!url || !token) {
  console.error("Missing Redis credentials. Run: vercel env pull .env.vercel.local");
  process.exit(1);
}

async function redis(...commands) {
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return (await res.json()).map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const norm = (e) => e.trim().replace(/^<|>$/g, "").toLowerCase();

const [cmd, ...args] = process.argv.slice(2);
const emails = (list) => [...new Set(list.flatMap((a) => a.match(EMAIL) ?? []).map(norm))];

if (cmd === "list") {
  const [members] = await redis(["SMEMBERS", KEY]);
  members.sort().forEach((m) => console.log(m));
  console.log(`\n${members.length} attendee(s)`);
} else if (cmd === "add" || cmd === "import") {
  const list = cmd === "import" ? emails([readFileSync(args[0], "utf8")]) : emails(args);
  if (!list.length) throw new Error("No email addresses given");
  const [added, total] = await redis(["SADD", KEY, ...list], ["SCARD", KEY]);
  console.log(`Added ${added} new of ${list.length} given. Allowlist now has ${total}.`);
} else if (cmd === "remove") {
  const list = emails(args);
  const [removed, total] = await redis(["SREM", KEY, ...list], ["SCARD", KEY]);
  console.log(`Removed ${removed}. Allowlist now has ${total}. Their sessions stop working on the next request.`);
} else if (cmd === "usage") {
  const [raw] = await redis(["SMEMBERS", KEY]);
  const members = raw.sort();
  const vals = members.length ? await redis(...members.flatMap((m) => [["GET", `pf:usage:${m}:queries`], ["GET", `pf:usage:${m}:tokens`]])) : [];
  members.forEach((m, idx) => {
    const i = idx * 2;
    console.log(`${m.padEnd(40)} ${String(vals[i] ?? 0).padStart(4)} questions  ${String(vals[i + 1] ?? 0).padStart(9)} tokens`);
  });
} else {
  console.log("Usage: npm run allowlist -- list | add <emails…> | remove <emails…> | import <file> | usage");
  process.exit(cmd ? 1 : 0);
}

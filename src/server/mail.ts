import "server-only";
import { env } from "./env";

const copy = {
  de: {
    subject: "Ihr Login für den Praxisforum-Assistenten",
    intro: "Mit diesem Link melden Sie sich beim Fragen-Assistenten zum Industrietag Rems-Murr Praxisforum 2026 an.",
    button: "Jetzt anmelden",
    note: "Der Link ist 20 Minuten gültig. Wenn Sie keinen Login angefordert haben, können Sie diese E-Mail ignorieren.",
  },
  en: {
    subject: "Your sign-in link for the Praxisforum assistant",
    intro: "Use this link to sign in to the question assistant for the Industrietag Rems-Murr Praxisforum 2026.",
    button: "Sign in now",
    note: "The link is valid for 20 minutes. If you didn't request it, you can ignore this email.",
  },
};

export async function sendMagicLink(to: string, url: string, lang: "de" | "en") {
  const c = copy[lang];
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#16213f">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden" cellpadding="0" cellspacing="0">
      <tr><td style="background:#2a4b9b;color:#ffffff;padding:22px 28px;font-size:18px;font-weight:bold">Praxisforum 2026</td></tr>
      <tr><td style="height:3px;background:linear-gradient(90deg,#18a0f5,#8a24df,#e2307f,#ff7a3d,#ffc926)"></td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 22px;font-size:16px;line-height:1.5">${c.intro}</p>
        <p style="margin:0 0 26px"><a href="${url}" style="display:inline-block;background:#2a4b9b;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:6px">${c.button}</a></p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#66708c">${c.note}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.mailFrom(), to: [to], subject: c.subject, html, text: `${c.intro}\n\n${url}\n\n${c.note}` }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

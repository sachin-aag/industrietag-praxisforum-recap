import { NextResponse } from "next/server";
import { currentUser, touchSession } from "@/server/auth";
import { getHistory } from "@/server/history";
import { getUsage } from "@/server/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (user) await touchSession(user.email);
  let questionsLeft: number | null = null;
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  if (user) {
    try {
      const u = await getUsage(user.email);
      questionsLeft = u.tokens >= u.maxTokens ? 0 : Math.max(0, u.maxQueries - u.queries);
    } catch (err) {
      console.error("[me] usage", err);
    }
    try {
      messages = await getHistory(user.email);
    } catch (err) {
      console.error("[me] history", err);
    }
  }
  return NextResponse.json({ user, questionsLeft, messages }, { headers: { "Cache-Control": "no-store" } });
}

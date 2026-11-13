import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { getUsage } from "@/server/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  let questionsLeft: number | null = null;
  if (user) {
    try {
      const u = await getUsage(user.email);
      questionsLeft = u.tokens >= u.maxTokens ? 0 : Math.max(0, u.maxQueries - u.queries);
    } catch (err) {
      console.error("[me] usage", err);
    }
  }
  return NextResponse.json({ user, questionsLeft }, { headers: { "Cache-Control": "no-store" } });
}

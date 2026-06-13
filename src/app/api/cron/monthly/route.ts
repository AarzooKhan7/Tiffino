import { NextRequest, NextResponse } from "next/server";
import { applyMonthEndRollover } from "@/app/redemptions/actions";
import { nowIST } from "@/lib/ist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Compute the month that just ended (this job runs on the 1st)
  const now = nowIST();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const targetMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const result = await applyMonthEndRollover(targetMonth);
  return NextResponse.json({ targetMonth, ...result });
}

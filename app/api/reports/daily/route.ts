import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { formatShanghaiDate, getShanghaiDayWindow } from "@/lib/reports/daily";

export async function GET(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateText = searchParams.get("date") ?? formatShanghaiDate();
  const window = getShanghaiDayWindow(dateText);

  if (!window) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const report = await db.dailyReport.findUnique({
    where: {
      userId_date: {
        userId,
        date: window.start,
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}

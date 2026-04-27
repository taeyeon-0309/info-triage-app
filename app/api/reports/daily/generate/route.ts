import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { buildDailyReportPayload, formatShanghaiDate, getShanghaiDayWindow } from "@/lib/reports/daily";

export async function POST(request: Request) {
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

  const items = await db.contentItem.findMany({
    where: {
      userId,
      status: ContentStatus.ANALYZED,
      isUrlOnly: false,
      submittedAt: {
        gte: window.start,
        lt: window.end,
      },
    },
    include: {
      analyses: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  const payload = buildDailyReportPayload(items);

  const report = await db.dailyReport.upsert({
    where: {
      userId_date: {
        userId,
        date: window.start,
      },
    },
    update: {
      ...payload,
      generatedAt: new Date(),
    },
    create: {
      userId,
      date: window.start,
      ...payload,
    },
  });

  return NextResponse.json({ report });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await db.source.findMany({
    where: { userId },
    orderBy: [{ isBlocked: "asc" }, { qualityScore: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      platform: true,
      url: true,
      qualityScore: true,
      isBlocked: true,
      _count: {
        select: { contentItems: true },
      },
    },
  });

  return NextResponse.json({ sources });
}

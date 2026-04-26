import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { generateContentAnalysis } from "@/lib/analysis/anthropic";
import { applyActionFallbackRules } from "@/lib/analysis/rules";

type AnalyzeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: AnalyzeRouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = (await request.json().catch(() => ({}))) as { requestId?: string };
  const requestId = body.requestId?.trim();

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const content = await db.contentItem.findFirst({
    where: { id, userId },
  });

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (content.isUrlOnly || (!content.rawText && !content.summary)) {
    return NextResponse.json({ error: "URL-only content cannot be analyzed" }, { status: 400 });
  }

  const existing = await db.contentAnalysis.findUnique({
    where: {
      contentItemId_requestId: {
        contentItemId: content.id,
        requestId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      analysisId: existing.id,
      status: "EXISTING_RESULT",
      contentStatus: content.status,
    });
  }

  const [topics, recentItems, latestCurrent] = await Promise.all([
    db.topic.findMany({
      where: { userId, isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
    db.contentItem.findMany({
      where: {
        userId,
        id: { not: content.id },
        status: ContentStatus.ANALYZED,
      },
      orderBy: { submittedAt: "desc" },
      select: { title: true, summary: true },
      take: 50,
    }),
    db.contentAnalysis.findFirst({
      where: { contentItemId: content.id, isCurrent: true },
      orderBy: { version: "desc" },
      select: { version: true, id: true },
    }),
  ]);

  try {
    const generated = await generateContentAnalysis({
      content,
      topics,
      recentItems,
    });

    const normalized = applyActionFallbackRules(generated.parsed);

    const nextVersion = (latestCurrent?.version ?? 0) + 1;

    const created = await db.$transaction(async (tx) => {
      if (latestCurrent) {
        await tx.contentAnalysis.updateMany({
          where: {
            contentItemId: content.id,
            isCurrent: true,
          },
          data: {
            isCurrent: false,
            supersededAt: new Date(),
          },
        });
      }

      const analysis = await tx.contentAnalysis.create({
        data: {
          contentItemId: content.id,
          userId,
          requestId,
          version: nextVersion,
          isCurrent: true,
          modelName: generated.modelName,
          rawModelOutput: generated.rawOutput,
          ...normalized,
        },
      });

      await tx.contentItem.update({
        where: { id: content.id },
        data: {
          status: ContentStatus.ANALYZED,
        },
      });

      return analysis;
    });

    return NextResponse.json({
      analysisId: created.id,
      status: "ANALYZED",
      version: created.version,
    });
  } catch (error) {
    await db.contentItem.update({
      where: { id: content.id },
      data: {
        status: ContentStatus.ANALYSIS_FAILED,
      },
    });

    return NextResponse.json(
      {
        error: "Analysis failed",
        errorType: error instanceof Error ? error.message : "UNKNOWN",
      },
      { status: 500 },
    );
  }
}

import { FeedbackType } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createContentFeedbackSchema } from "@/lib/validators/feedback";

type ContentFeedbackRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: ContentFeedbackRouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createContentFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const current = await db.contentItem.findFirst({
    where: { id, userId },
    select: {
      id: true,
      sourceId: true,
      analyses: {
        where: { isCurrent: true },
        take: 1,
        select: { topicTags: true },
      },
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const feedback = await db.$transaction(async (tx) => {
    const created = await tx.contentFeedback.create({
      data: {
        userId,
        contentItemId: current.id,
        feedbackType: parsed.data.feedbackType,
        note: parsed.data.note?.trim() || null,
      },
      select: {
        id: true,
        feedbackType: true,
        note: true,
        createdAt: true,
      },
    });

    if (current.sourceId && parsed.data.feedbackType === FeedbackType.SOURCE_HIGH_QUALITY) {
      const source = await tx.source.findFirst({
        where: { id: current.sourceId, userId },
        select: { id: true, qualityScore: true },
      });
      if (source) {
        await tx.source.update({
          where: { id: source.id },
          data: { qualityScore: Math.min(100, source.qualityScore + 10) },
        });
      }
    }

    if (current.sourceId && parsed.data.feedbackType === FeedbackType.SOURCE_LOW_QUALITY) {
      const source = await tx.source.findFirst({
        where: { id: current.sourceId, userId },
        select: { id: true, qualityScore: true },
      });
      if (source) {
        await tx.source.update({
          where: { id: source.id },
          data: { qualityScore: Math.max(0, source.qualityScore - 10) },
        });
      }
    }

    if (current.sourceId && parsed.data.feedbackType === FeedbackType.BLOCK_THIS_SOURCE) {
      await tx.source.updateMany({
        where: { id: current.sourceId, userId },
        data: { isBlocked: true },
      });
    }

    if (parsed.data.feedbackType === FeedbackType.TRACK_THIS_TOPIC) {
      const topicName = parsed.data.note?.trim() || current.analyses[0]?.topicTags[0];
      if (topicName) {
        await tx.topic.upsert({
          where: { userId_name: { userId, name: topicName } },
          update: { isActive: true },
          create: {
            userId,
            name: topicName,
            priority: 70,
            isActive: true,
          },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

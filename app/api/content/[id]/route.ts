import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

type ContentDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ContentDetailRouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const item = await db.contentItem.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      url: true,
      rawText: true,
      summary: true,
      note: true,
      platform: true,
      author: true,
      publishedAt: true,
      submittedAt: true,
      status: true,
      readStatus: true,
      isUrlOnly: true,
      analyses: {
        where: { isCurrent: true },
        take: 1,
        orderBy: { version: "desc" },
        select: {
          id: true,
          recommendedAction: true,
          readingValueScore: true,
          informationGainScore: true,
          sourceCredibilityScore: true,
          personalRelevanceScore: true,
          duplicationScore: true,
          marketingSuspicionScore: true,
          emotionalNoiseScore: true,
          hasPrimarySource: true,
          suspectedAiPackaging: true,
          suspectedMultiLayerRepackaging: true,
          coreSummary: true,
          coreClaims: true,
          recommendationReasons: true,
          skipReasons: true,
          suggestedReadingMethod: true,
          topicTags: true,
          sourceTypeTags: true,
          valueTags: true,
          analyzedAt: true,
          modelName: true,
          version: true,
        },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          feedbackType: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { analyses, ...rest } = item;

  return NextResponse.json({
    item: {
      ...rest,
      analysis: analyses[0] ?? null,
    },
  });
}

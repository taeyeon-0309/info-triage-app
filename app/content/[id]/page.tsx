import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import ContentDetailClient from "./content-detail-client";

type ContentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="w-full px-6 py-10">
        <h1 className="text-3xl font-semibold">内容详情</h1>
        <p className="mt-3 text-sm text-zinc-600">请先登录后查看内容详情。</p>
      </div>
    );
  }

  const { id } = await params;

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
          coreSummary: true,
          coreClaims: true,
          recommendationReasons: true,
          skipReasons: true,
          topicTags: true,
          valueTags: true,
          suggestedReadingMethod: true,
          modelName: true,
          analyzedAt: true,
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
        take: 20,
      },
    },
  });

  if (!item) {
    notFound();
  }

  return <ContentDetailClient item={{ ...item, analysis: item.analyses[0] ?? null }} />;
}

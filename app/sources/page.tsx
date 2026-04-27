import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import SourcesClient from "./sources-client";

export default async function SourcesPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <SourcesClient initialSources={[]} initialError="请先登录后管理来源" />;
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

  return <SourcesClient initialSources={sources} />;
}

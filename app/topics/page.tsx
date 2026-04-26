import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import TopicsClient from "./topics-client";

export default async function TopicsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <TopicsClient initialTopics={[]} initialError="请先登录后管理主题" />;
  }

  const topics = await db.topic.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      priority: true,
      isActive: true,
    },
  });

  return <TopicsClient initialTopics={topics} />;
}

import { RecommendedAction, type ContentAnalysis, type ContentItem } from "@prisma/client";

export type DailyReportCandidate = ContentItem & {
  analyses: ContentAnalysis[];
};

export function getShanghaiDayWindow(dateText: string) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateText)) {
    return null;
  }

  const start = new Date(`${dateText}T00:00:00+08:00`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export function formatShanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function currentAnalysis(item: DailyReportCandidate) {
  return item.analyses[0];
}

function byReadingValueDesc(left: DailyReportCandidate, right: DailyReportCandidate) {
  const leftAnalysis = currentAnalysis(left);
  const rightAnalysis = currentAnalysis(right);

  return (
    (rightAnalysis?.readingValueScore ?? -1) - (leftAnalysis?.readingValueScore ?? -1) ||
    right.submittedAt.getTime() - left.submittedAt.getTime()
  );
}

export function buildDailyReportPayload(items: DailyReportCandidate[]) {
  const analyzedItems = items.filter((item) => currentAnalysis(item));
  const mustReadItems = analyzedItems
    .filter((item) => currentAnalysis(item)?.recommendedAction === RecommendedAction.DEEP_READ)
    .sort(byReadingValueDesc)
    .slice(0, 3);

  const skimItems = analyzedItems
    .filter((item) => currentAnalysis(item)?.recommendedAction === RecommendedAction.SKIM)
    .sort(byReadingValueDesc)
    .slice(0, 7);

  const skippedItems = analyzedItems
    .filter((item) => currentAnalysis(item)?.recommendedAction === RecommendedAction.SKIP)
    .sort(byReadingValueDesc);

  const topicCounts = new Map<string, { count: number; itemIds: Set<string> }>();
  for (const item of analyzedItems) {
    const analysis = currentAnalysis(item);
    for (const tag of analysis?.topicTags ?? []) {
      const entry = topicCounts.get(tag) ?? { count: 0, itemIds: new Set<string>() };
      entry.count += 1;
      entry.itemIds.add(item.id);
      topicCounts.set(tag, entry);
    }
  }

  const trackedTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([topic]) => topic);

  const anomalySignals = [...topicCounts.entries()]
    .filter(([, entry]) => entry.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([topic, entry]) => ({
      title: `${topic} 相关内容正在升温`,
      description: `该主题今天出现 ${entry.count} 次。`,
      relatedItemIds: [...entry.itemIds],
      reason: "同一主题在多条内容中重复出现，值得留意。",
    }));

  const summary = [
    `今日已分析 ${analyzedItems.length} 条内容。`,
    mustReadItems.length > 0 ? `建议精读 ${mustReadItems.length} 条。` : "暂无必须精读内容。",
    skimItems.length > 0 ? `建议略读 ${skimItems.length} 条。` : "暂无略读内容。",
    trackedTopics.length > 0 ? `重点关注：${trackedTopics.join("、")}。` : "",
  ]
    .filter(Boolean)
    .join("");

  return {
    mustReadItemIds: mustReadItems.map((item) => item.id),
    skimItemIds: skimItems.map((item) => item.id),
    skippedItemIds: skippedItems.map((item) => item.id),
    trackedTopics,
    anomalySignals,
    summary,
  };
}

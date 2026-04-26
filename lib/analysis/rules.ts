import { RecommendedAction } from "@prisma/client";
import type { ContentAnalysisOutput } from "@/lib/analysis/schema";

export function applyActionFallbackRules(payload: ContentAnalysisOutput): ContentAnalysisOutput {
  const shouldSkip =
    payload.readingValueScore < 50 ||
    payload.duplicationScore >= 70 ||
    payload.marketingSuspicionScore >= 75 ||
    payload.emotionalNoiseScore >= 80;

  const shouldDeepRead =
    payload.readingValueScore >= 80 &&
    payload.informationGainScore >= 70 &&
    payload.personalRelevanceScore >= 70 &&
    payload.duplicationScore < 50 &&
    payload.marketingSuspicionScore < 60;

  if (shouldSkip) {
    return {
      ...payload,
      recommendedAction: RecommendedAction.SKIP,
      skipReasons:
        payload.skipReasons.length > 0
          ? payload.skipReasons
          : ["信息增量低或重复度/营销嫌疑过高"],
    };
  }

  if (shouldDeepRead) {
    return {
      ...payload,
      recommendedAction: RecommendedAction.DEEP_READ,
    };
  }

  return payload;
}

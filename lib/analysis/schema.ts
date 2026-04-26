import { z } from "zod";

const recommendationAction = z.enum(["DEEP_READ", "SKIM", "ARCHIVE", "TRACK", "SKIP"]);

const score = z.number().int().min(0).max(100);

export const contentAnalysisOutputSchema = z.object({
  recommendedAction: recommendationAction,
  readingValueScore: score,
  informationGainScore: score,
  sourceCredibilityScore: score,
  personalRelevanceScore: score,
  duplicationScore: score,
  marketingSuspicionScore: score,
  emotionalNoiseScore: score,
  hasPrimarySource: z.boolean(),
  suspectedAiPackaging: z.boolean(),
  suspectedMultiLayerRepackaging: z.boolean(),
  coreSummary: z.string().min(1),
  coreClaims: z.array(z.string()),
  recommendationReasons: z.array(z.string()),
  skipReasons: z.array(z.string()),
  suggestedReadingMethod: z.string(),
  topicTags: z.array(z.string()),
  sourceTypeTags: z.array(z.string()),
  valueTags: z.array(z.string()),
});

export type ContentAnalysisOutput = z.infer<typeof contentAnalysisOutputSchema>;

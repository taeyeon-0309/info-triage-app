import Anthropic from "@anthropic-ai/sdk";
import { Prisma, type ContentItem, type Topic } from "@prisma/client";
import { contentAnalysisOutputSchema, type ContentAnalysisOutput } from "@/lib/analysis/schema";

const MODEL_NAME = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const ANALYSIS_TIMEOUT_MS = 30_000;
const RETRYABLE_ATTEMPTS = 3;

function buildPrompt(content: ContentItem, topics: Topic[], recentItems: Array<{ title: string; summary: string | null }>) {
  const topicsText = topics.map((topic) => `- ${topic.name}`).join("\n") || "- 暂无主题";
  const recentText = recentItems
    .map((item, index) => `${index + 1}. ${item.title} | ${item.summary ?? ""}`)
    .join("\n");

  return `你是一个个人信息流分诊助手。请只输出 JSON。\n\n用户关注主题：\n${topicsText}\n\n内容信息：\n标题：${content.title}\n平台：${content.platform}\n作者：${content.author ?? ""}\n链接：${content.url ?? ""}\n正文：\n${content.rawText ?? content.summary ?? ""}\n\n最近内容：\n${recentText}\n\n严格输出 JSON 字段：\nrecommendedAction, readingValueScore, informationGainScore, sourceCredibilityScore, personalRelevanceScore, duplicationScore, marketingSuspicionScore, emotionalNoiseScore, hasPrimarySource, suspectedAiPackaging, suspectedMultiLayerRepackaging, coreSummary, coreClaims, recommendationReasons, skipReasons, suggestedReadingMethod, topicTags, sourceTypeTags, valueTags`;
}

function parseModelJson(rawText: string): ContentAnalysisOutput {
  const parsedJson = JSON.parse(rawText);
  const parsed = contentAnalysisOutputSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error("INVALID_ANALYSIS_JSON");
  }

  return parsed.data;
}

export async function generateContentAnalysis(args: {
  content: ContentItem;
  topics: Topic[];
  recentItems: Array<{ title: string; summary: string | null }>;
}): Promise<{ parsed: ContentAnalysisOutput; modelName: string; rawOutput: Prisma.InputJsonValue }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY_MISSING");
  }

  const client = new Anthropic({ apiKey });

  const startedAt = Date.now();
  let lastError: unknown;
  let response: Awaited<ReturnType<typeof client.messages.create>> | null = null;

  for (let attempt = 1; attempt <= RETRYABLE_ATTEMPTS; attempt += 1) {
    try {
      response = await Promise.race([
        client.messages.create({
          model: MODEL_NAME,
          max_tokens: 1200,
          temperature: 0.1,
          messages: [
            {
              role: "user",
              content: buildPrompt(args.content, args.topics, args.recentItems),
            },
          ],
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("ANALYSIS_TIMEOUT")), ANALYSIS_TIMEOUT_MS);
        }),
      ]);
      break;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const lowerMessage = message.toLowerCase();
      const retryable =
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("5") ||
        lowerMessage.includes("fetch");
      if (!retryable || attempt === RETRYABLE_ATTEMPTS) {
        console.error("content_analysis_failed", {
          modelName: MODEL_NAME,
          latencyMs: Date.now() - startedAt,
          status: "failed",
          errorType: message,
        });
        throw error;
      }
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error("EMPTY_ANALYSIS_RESPONSE");
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new Error("EMPTY_ANALYSIS_RESPONSE");
  }

  const parsed = parseModelJson(textBlock.text);

  console.info("content_analysis_succeeded", {
    modelName: response.model,
    latencyMs: Date.now() - startedAt,
    tokenUsage: response.usage,
    status: "success",
  });

  return {
    parsed,
    modelName: response.model,
    rawOutput: JSON.parse(JSON.stringify({
      responseId: response.id,
      content: response.content,
      usage: response.usage,
    })) as Prisma.InputJsonValue,
  };
}

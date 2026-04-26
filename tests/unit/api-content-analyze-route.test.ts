import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findFirstContentMock = vi.fn();
const findUniqueAnalysisMock = vi.fn();
const findManyTopicMock = vi.fn();
const findManyContentMock = vi.fn();
const findFirstCurrentAnalysisMock = vi.fn();
const updateContentMock = vi.fn();
const updateManyAnalysisMock = vi.fn();
const createAnalysisMock = vi.fn();
const transactionMock = vi.fn();
const generateContentAnalysisMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/analysis/anthropic", () => ({
  generateContentAnalysis: generateContentAnalysisMock,
}));

vi.mock("@/lib/analysis/rules", () => ({
  applyActionFallbackRules: (value: unknown) => value,
}));

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      findFirst: findFirstContentMock,
      findMany: findManyContentMock,
      update: updateContentMock,
    },
    topic: {
      findMany: findManyTopicMock,
    },
    contentAnalysis: {
      findUnique: findUniqueAnalysisMock,
      findFirst: findFirstCurrentAnalysisMock,
      updateMany: updateManyAnalysisMock,
      create: createAnalysisMock,
    },
    $transaction: transactionMock,
  },
}));

describe("POST /api/content/[id]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        contentAnalysis: {
          updateMany: updateManyAnalysisMock,
          create: createAnalysisMock,
        },
        contentItem: {
          update: updateContentMock,
        },
      }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/analyze/route");

    const response = await POST(
      new Request("http://localhost/api/content/id/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: "req-1" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for url-only content", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce({
      id: "content-1",
      userId: "user-1",
      isUrlOnly: true,
      rawText: null,
      summary: null,
      status: "PENDING_ANALYSIS",
    });

    const { POST } = await import("@/app/api/content/[id]/analyze/route");

    const response = await POST(
      new Request("http://localhost/api/content/id/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: "req-1" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns existing result for same requestId", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce({
      id: "content-1",
      userId: "user-1",
      isUrlOnly: false,
      rawText: "abc",
      summary: null,
      status: "PENDING_ANALYSIS",
    });
    findUniqueAnalysisMock.mockResolvedValueOnce({
      id: "analysis-1",
    });

    const { POST } = await import("@/app/api/content/[id]/analyze/route");

    const response = await POST(
      new Request("http://localhost/api/content/id/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: "req-1" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysisId).toBe("analysis-1");
    expect(body.status).toBe("EXISTING_RESULT");
  });

  it("creates analysis and updates content status", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce({
      id: "content-1",
      userId: "user-1",
      isUrlOnly: false,
      rawText: "abc",
      summary: null,
      title: "Title",
      platform: "WEBSITE",
      author: null,
      url: null,
      status: "PENDING_ANALYSIS",
    });
    findUniqueAnalysisMock.mockResolvedValueOnce(null);
    findManyTopicMock.mockResolvedValueOnce([]);
    findManyContentMock.mockResolvedValueOnce([]);
    findFirstCurrentAnalysisMock.mockResolvedValueOnce(null);
    generateContentAnalysisMock.mockResolvedValueOnce({
      parsed: {
        recommendedAction: "SKIM",
        readingValueScore: 60,
        informationGainScore: 60,
        sourceCredibilityScore: 60,
        personalRelevanceScore: 60,
        duplicationScore: 20,
        marketingSuspicionScore: 20,
        emotionalNoiseScore: 20,
        hasPrimarySource: true,
        suspectedAiPackaging: false,
        suspectedMultiLayerRepackaging: false,
        coreSummary: "summary",
        coreClaims: [],
        recommendationReasons: [],
        skipReasons: [],
        suggestedReadingMethod: "skim",
        topicTags: [],
        sourceTypeTags: [],
        valueTags: [],
      },
      modelName: "claude-sonnet-4-6",
      rawOutput: { ok: true },
    });

    createAnalysisMock.mockResolvedValueOnce({ id: "analysis-2", version: 1 });

    const { POST } = await import("@/app/api/content/[id]/analyze/route");

    const response = await POST(
      new Request("http://localhost/api/content/id/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: "req-2" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ANALYZED");
    expect(body.analysisId).toBe("analysis-2");
    expect(createAnalysisMock).toHaveBeenCalledTimes(1);
    expect(updateContentMock).toHaveBeenCalled();
  });
});

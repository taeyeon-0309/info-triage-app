import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findFirstContentMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      findFirst: findFirstContentMock,
    },
  },
}));

describe("GET /api/content/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/content/[id]/route");

    const response = await GET(new Request("http://localhost/api/content/content-1"), {
      params: Promise.resolve({ id: "content-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when content is not found", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/content/[id]/route");

    const response = await GET(new Request("http://localhost/api/content/content-1"), {
      params: Promise.resolve({ id: "content-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns content detail with current analysis", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce({
      id: "content-1",
      title: "Title",
      url: "https://example.com",
      rawText: "raw",
      summary: "summary",
      platform: "WEBSITE",
      author: "author",
      publishedAt: null,
      submittedAt: new Date().toISOString(),
      status: "ANALYZED",
      readStatus: "UNREAD",
      isUrlOnly: false,
      analyses: [
        {
          id: "analysis-1",
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
          coreSummary: "core",
          coreClaims: ["claim"],
          recommendationReasons: ["reason"],
          skipReasons: [],
          suggestedReadingMethod: "skim",
          topicTags: ["AI"],
          sourceTypeTags: ["NEWS"],
          valueTags: ["ACTIONABLE"],
          analyzedAt: new Date().toISOString(),
          modelName: "claude-sonnet-4-6",
          version: 1,
        },
      ],
      feedbacks: [],
    });

    const { GET } = await import("@/app/api/content/[id]/route");

    const response = await GET(new Request("http://localhost/api/content/content-1"), {
      params: Promise.resolve({ id: "content-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.item.id).toBe("content-1");
    expect(body.item.analysis.id).toBe("analysis-1");
  });
});

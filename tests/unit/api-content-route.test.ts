import { beforeEach, describe, expect, it, vi } from "vitest";

const createContentItemMock = vi.fn();
const getCurrentUserIdMock = vi.fn();
const countContentMock = vi.fn();
const findManyContentMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      count: countContentMock,
      findMany: findManyContentMock,
    },
  },
}));

vi.mock("@/lib/repositories/content-repo", () => ({
  createContentItem: createContentItemMock,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

describe("/api/content route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 on GET when user is not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/content/route");

    const response = await GET(new Request("http://localhost/api/content"));

    expect(response.status).toBe(401);
  });

  it("returns paginated list on GET", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    countContentMock.mockResolvedValueOnce(1);
    findManyContentMock.mockResolvedValueOnce([
      {
        id: "content-1",
        title: "Title",
        platform: "WEBSITE",
        status: "ANALYZED",
        readStatus: "UNREAD",
        submittedAt: new Date().toISOString(),
        isUrlOnly: false,
        analyses: [],
      },
    ]);

    const { GET } = await import("@/app/api/content/route");

    const response = await GET(new Request("http://localhost/api/content?page=1&pageSize=20"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("returns 401 when user is not authenticated on POST", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/content/route");

    const response = await POST(
      new Request("http://localhost/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform: "WEBSITE", rawText: "hello" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("creates content for authenticated user", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    createContentItemMock.mockResolvedValueOnce({
      id: "content-1",
      status: "PENDING_ANALYSIS",
      isUrlOnly: false,
    });

    const { POST } = await import("@/app/api/content/route");

    const response = await POST(
      new Request("http://localhost/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform: "WEBSITE", rawText: "hello" }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.contentItemId).toBe("content-1");
    expect(createContentItemMock).toHaveBeenCalledTimes(1);
  });
});

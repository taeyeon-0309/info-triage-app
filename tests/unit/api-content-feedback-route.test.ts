import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findFirstContentMock = vi.fn();
const createFeedbackMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      findFirst: findFirstContentMock,
    },
    contentFeedback: {
      create: createFeedbackMock,
    },
  },
}));

describe("POST /api/content/[id]/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/feedback/route");

    const response = await POST(
      new Request("http://localhost/api/content/content-1/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackType: "ACCURATE" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when content is not found", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/feedback/route");

    const response = await POST(
      new Request("http://localhost/api/content/content-1/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackType: "ACCURATE" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("creates feedback for authenticated user", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstContentMock.mockResolvedValueOnce({ id: "content-1" });
    createFeedbackMock.mockResolvedValueOnce({
      id: "feedback-1",
      feedbackType: "ACCURATE",
      note: "ok",
      createdAt: new Date().toISOString(),
    });

    const { POST } = await import("@/app/api/content/[id]/feedback/route");

    const response = await POST(
      new Request("http://localhost/api/content/content-1/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedbackType: "ACCURATE", note: "ok" }),
      }),
      { params: Promise.resolve({ id: "content-1" }) },
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.feedback.id).toBe("feedback-1");
    expect(createFeedbackMock).toHaveBeenCalledTimes(1);
  });
});

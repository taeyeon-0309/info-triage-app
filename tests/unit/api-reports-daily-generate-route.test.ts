import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findManyContentMock = vi.fn();
const upsertDailyReportMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    contentItem: {
      findMany: findManyContentMock,
    },
    dailyReport: {
      upsert: upsertDailyReportMock,
    },
  },
}));

describe("POST /api/reports/daily/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/reports/daily/generate/route");
    const response = await POST(new Request("http://localhost/api/reports/daily/generate"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when date is invalid", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");

    const { POST } = await import("@/app/api/reports/daily/generate/route");
    const response = await POST(new Request("http://localhost/api/reports/daily/generate?date=invalid"));

    expect(response.status).toBe(400);
  });

  it("upserts generated report", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findManyContentMock.mockResolvedValueOnce([
      {
        id: "content-1",
        submittedAt: new Date("2026-04-27T10:00:00+08:00"),
        analyses: [
          {
            recommendedAction: "DEEP_READ",
            readingValueScore: 80,
            topicTags: ["AI"],
          },
        ],
      },
    ]);
    upsertDailyReportMock.mockResolvedValueOnce({
      id: "report-1",
      userId: "user-1",
      summary: "done",
    });

    const { POST } = await import("@/app/api/reports/daily/generate/route");
    const response = await POST(new Request("http://localhost/api/reports/daily/generate?date=2026-04-27"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.report.id).toBe("report-1");
    expect(upsertDailyReportMock).toHaveBeenCalledTimes(1);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findUniqueDailyReportMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyReport: {
      findUnique: findUniqueDailyReportMock,
    },
  },
}));

describe("GET /api/reports/daily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/reports/daily/route");
    const response = await GET(new Request("http://localhost/api/reports/daily"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when date is invalid", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");

    const { GET } = await import("@/app/api/reports/daily/route");
    const response = await GET(new Request("http://localhost/api/reports/daily?date=invalid"));

    expect(response.status).toBe(400);
  });

  it("returns 404 when report is not found", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findUniqueDailyReportMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/reports/daily/route");
    const response = await GET(new Request("http://localhost/api/reports/daily?date=2026-04-27"));

    expect(response.status).toBe(404);
  });

  it("returns report payload", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findUniqueDailyReportMock.mockResolvedValueOnce({
      id: "report-1",
      userId: "user-1",
      date: new Date("2026-04-27T00:00:00+08:00"),
      mustReadItemIds: ["content-1"],
      skimItemIds: [],
      skippedItemIds: [],
      trackedTopics: ["AI"],
      anomalySignals: [],
      summary: "ok",
    });

    const { GET } = await import("@/app/api/reports/daily/route");
    const response = await GET(new Request("http://localhost/api/reports/daily?date=2026-04-27"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.report.id).toBe("report-1");
  });
});

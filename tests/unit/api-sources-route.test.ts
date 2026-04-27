import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn();
const findManySourceMock = vi.fn();
const findFirstSourceMock = vi.fn();
const updateSourceMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    source: {
      findMany: findManySourceMock,
      findFirst: findFirstSourceMock,
      update: updateSourceMock,
    },
  },
}));

describe("/api/sources routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 on GET when not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/sources/route");

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns sources on GET", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findManySourceMock.mockResolvedValueOnce([{ id: "source-1", name: "S" }]);

    const { GET } = await import("@/app/api/sources/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sources).toHaveLength(1);
  });

  it("returns 401 on PATCH when not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);
    const { PATCH } = await import("@/app/api/sources/[id]/route");

    const response = await PATCH(
      new Request("http://localhost/api/sources/source-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qualityScore: 70 }),
      }),
      { params: Promise.resolve({ id: "source-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 on PATCH when source is not found", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstSourceMock.mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/sources/[id]/route");

    const response = await PATCH(
      new Request("http://localhost/api/sources/source-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qualityScore: 70 }),
      }),
      { params: Promise.resolve({ id: "source-1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("updates source on PATCH", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findFirstSourceMock.mockResolvedValueOnce({ id: "source-1" });
    updateSourceMock.mockResolvedValueOnce({ id: "source-1", qualityScore: 70, isBlocked: false });

    const { PATCH } = await import("@/app/api/sources/[id]/route");

    const response = await PATCH(
      new Request("http://localhost/api/sources/source-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qualityScore: 70 }),
      }),
      { params: Promise.resolve({ id: "source-1" }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source.id).toBe("source-1");
    expect(updateSourceMock).toHaveBeenCalledTimes(1);
  });
});

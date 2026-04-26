import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const createMock = vi.fn();
const getCurrentUserIdMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    topic: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

describe("/api/topics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/topics/route");

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns user topics", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    findManyMock.mockResolvedValueOnce([{ id: "t1", name: "AI" }]);

    const { GET } = await import("@/app/api/topics/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.topics).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it("creates topic for authenticated user", async () => {
    getCurrentUserIdMock.mockResolvedValueOnce("user-1");
    createMock.mockResolvedValueOnce({ id: "t1", name: "AI", priority: 80, isActive: true, description: null });

    const { POST } = await import("@/app/api/topics/route");

    const response = await POST(
      new Request("http://localhost/api/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "AI", priority: 80, isActive: true }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

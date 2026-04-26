import { describe, expect, it } from "vitest";
import { createContentSchema } from "@/lib/validators/content";

describe("createContentSchema", () => {
  it("accepts url-only input", () => {
    const result = createContentSchema.safeParse({
      url: "https://example.com/article",
      platform: "WEBSITE",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when both url and rawText are missing", () => {
    const result = createContentSchema.safeParse({
      title: "x",
      platform: "WEBSITE",
    });

    expect(result.success).toBe(false);
  });
});

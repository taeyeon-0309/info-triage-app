import { describe, expect, it } from "vitest";
import { createTopicSchema, updateTopicSchema } from "@/lib/validators/topic";

describe("topic validators", () => {
  it("accepts valid create payload", () => {
    const result = createTopicSchema.safeParse({
      name: "AI Agent",
      description: "关注 agent 工程化",
      priority: 80,
      isActive: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty create name", () => {
    const result = createTopicSchema.safeParse({
      name: "",
      priority: 50,
    });

    expect(result.success).toBe(false);
  });

  it("rejects update with empty payload", () => {
    const result = updateTopicSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

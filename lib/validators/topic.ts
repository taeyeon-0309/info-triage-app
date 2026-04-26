import { z } from "zod";

export const createTopicSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateTopicSchema = createTopicSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "至少需要一个更新字段" },
);

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

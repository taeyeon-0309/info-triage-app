import { z } from "zod";
import { sourcePlatforms } from "@/lib/constants/platform";

export const createContentSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    url: z.url().optional(),
    rawText: z.string().trim().min(1).optional(),
    platform: z.enum(sourcePlatforms),
    author: z.string().trim().max(200).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.url || value.rawText), {
    message: "url 与 rawText 至少需要一个",
    path: ["url"],
  });

export const createContentBatchSchema = z.object({
  items: z.array(createContentSchema).min(1).max(100),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type CreateContentBatchInput = z.infer<typeof createContentBatchSchema>;

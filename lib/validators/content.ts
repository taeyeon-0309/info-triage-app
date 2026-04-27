import { z } from "zod";
import { sourcePlatforms } from "@/lib/constants/platform";

const optionalTrimmedString = (maxLength?: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    maxLength
      ? z.string().trim().min(1).max(maxLength).optional()
      : z.string().trim().min(1).optional(),
  );

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);

export const createContentSchema = z
  .object({
    title: optionalTrimmedString(300),
    url: optionalUrl,
    rawText: optionalTrimmedString(),
    platform: z.enum(sourcePlatforms),
    author: optionalTrimmedString(200),
    note: optionalTrimmedString(2000),
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

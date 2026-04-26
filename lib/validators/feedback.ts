import { FeedbackType } from "@prisma/client";
import { z } from "zod";

export const createContentFeedbackSchema = z.object({
  feedbackType: z.nativeEnum(FeedbackType),
  note: z.string().trim().max(500).optional(),
});

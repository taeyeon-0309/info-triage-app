import type { ContentItem, ContentStatus } from "@prisma/client";
import type { SourcePlatform } from "@/lib/constants/platform";

export type CreateContentRequest = {
  title?: string;
  url?: string;
  rawText?: string;
  platform: SourcePlatform;
  author?: string;
  note?: string;
};

export type CreateContentResponse = {
  contentItemId: string;
  status: ContentStatus;
  isUrlOnly: boolean;
};

export type BatchCreateContentResponse = {
  successCount: number;
  failedCount: number;
  successes: CreateContentResponse[];
  failures: Array<{ index: number; error: string }>;
};

export type PersistedContentItem = Pick<
  ContentItem,
  "id" | "status" | "isUrlOnly"
>;

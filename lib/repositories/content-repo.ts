import { ContentStatus, SourcePlatform, type Prisma, type PrismaClient } from "@prisma/client";
import type { CreateContentRequest, PersistedContentItem } from "@/lib/types/content";

function buildTitle(input: CreateContentRequest): string {
  if (input.title && input.title.trim().length > 0) {
    return input.title.trim();
  }

  if (input.rawText && input.rawText.trim().length > 0) {
    return input.rawText.trim().slice(0, 80);
  }

  if (input.url) {
    return input.url;
  }

  return "Untitled";
}

function normalizePayload(userId: string, input: CreateContentRequest): Prisma.ContentItemCreateInput {
  const normalizedRawText = input.rawText?.trim();
  const normalizedUrl = input.url?.trim();
  const normalizedAuthor = input.author?.trim();

  const isUrlOnly = Boolean(normalizedUrl) && !normalizedRawText;
  const sourceName = normalizedAuthor || normalizedUrl || `${input.platform} submission`;

  return {
    user: {
      connect: { id: userId },
    },
    source: {
      connectOrCreate: {
        where: {
          userId_name: {
            userId,
            name: sourceName,
          },
        },
        create: {
          user: {
            connect: { id: userId },
          },
          name: sourceName,
          platform: input.platform as SourcePlatform,
          url: normalizedUrl,
        },
      },
    },
    title: buildTitle(input),
    url: normalizedUrl,
    rawText: normalizedRawText,
    note: input.note?.trim() || null,
    platform: input.platform as SourcePlatform,
    author: normalizedAuthor || null,
    status: ContentStatus.PENDING_ANALYSIS,
    isUrlOnly,
  };
}

export async function createContentItem(
  prisma: PrismaClient,
  userId: string,
  input: CreateContentRequest,
): Promise<PersistedContentItem> {
  return prisma.contentItem.create({
    data: normalizePayload(userId, input),
    select: {
      id: true,
      status: true,
      isUrlOnly: true,
    },
  });
}

export async function createContentItemsInBatch(
  prisma: PrismaClient,
  userId: string,
  items: CreateContentRequest[],
): Promise<PersistedContentItem[]> {
  const results: PersistedContentItem[] = [];

  for (const item of items) {
    const created = await createContentItem(prisma, userId, item);
    results.push(created);
  }

  return results;
}

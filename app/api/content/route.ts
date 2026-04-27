import { Prisma, ReadStatus, SourcePlatform } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createContentItem } from "@/lib/repositories/content-repo";
import { createContentSchema } from "@/lib/validators/content";

const listQuerySchema = {
  page: { defaultValue: 1, min: 1, max: 10000 },
  pageSize: { defaultValue: 20, min: 1, max: 100 },
};

function parseIntRange(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSortBy(value: string | null): "submittedAt" | "readingValue" {
  if (value === "readingValue") {
    return "readingValue";
  }

  return "submittedAt";
}

function mergeAnalysisFilter(
  where: Prisma.ContentItemWhereInput,
  filter: NonNullable<Prisma.ContentItemWhereInput["analyses"]>["some"],
) {
  where.analyses = {
    some: {
      ...(where.analyses?.some ?? {}),
      ...filter,
    },
  };
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = parseIntRange(
    searchParams.get("page"),
    listQuerySchema.page.defaultValue,
    listQuerySchema.page.min,
    listQuerySchema.page.max,
  );
  const pageSize = parseIntRange(
    searchParams.get("pageSize"),
    listQuerySchema.pageSize.defaultValue,
    listQuerySchema.pageSize.min,
    listQuerySchema.pageSize.max,
  );

  const platformParam = searchParams.get("platform");
  const readStatusParam = searchParams.get("readStatus");
  const recommendedActionParam = searchParams.get("recommendedAction");
  const topicParam = searchParams.get("topic")?.trim();
  const fromDate = parseDate(searchParams.get("fromDate"));
  const toDate = parseDate(searchParams.get("toDate"));
  const sortBy = parseSortBy(searchParams.get("sortBy"));

  const where: Prisma.ContentItemWhereInput = {
    userId,
  };

  if (platformParam && Object.values(SourcePlatform).includes(platformParam as SourcePlatform)) {
    where.platform = platformParam as SourcePlatform;
  }

  if (readStatusParam && Object.values(ReadStatus).includes(readStatusParam as ReadStatus)) {
    where.readStatus = readStatusParam as ReadStatus;
  }

  if (fromDate || toDate) {
    where.submittedAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  if (recommendedActionParam) {
    mergeAnalysisFilter(where, {
      isCurrent: true,
      recommendedAction: recommendedActionParam as Prisma.EnumRecommendedActionFilter["equals"],
    });
  }

  if (topicParam) {
    mergeAnalysisFilter(where, {
      isCurrent: true,
      topicTags: {
        has: topicParam,
      },
    });
  }

  const total = await db.contentItem.count({ where });

  const baseSelect = {
    id: true,
    title: true,
    platform: true,
    status: true,
    readStatus: true,
    submittedAt: true,
    isUrlOnly: true,
    analyses: {
      where: { isCurrent: true },
      take: 1,
      select: {
        recommendedAction: true,
        readingValueScore: true,
        topicTags: true,
      },
    },
  } satisfies Prisma.ContentItemSelect;

  const items =
    sortBy === "readingValue"
      ? (
          await db.contentItem.findMany({
            where,
            orderBy: [{ submittedAt: "desc" }],
            select: baseSelect,
          })
        )
          .sort((a, b) => {
            const left = a.analyses[0]?.readingValueScore ?? -1;
            const right = b.analyses[0]?.readingValueScore ?? -1;
            return right - left || b.submittedAt.getTime() - a.submittedAt.getTime();
          })
          .slice((page - 1) * pageSize, page * pageSize)
      : await db.contentItem.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: baseSelect,
    });

  return NextResponse.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const content = await createContentItem(db, userId, parsed.data);

  return NextResponse.json(
    {
      contentItemId: content.id,
      status: content.status,
      isUrlOnly: content.isUrlOnly,
    },
    { status: 201 },
  );
}

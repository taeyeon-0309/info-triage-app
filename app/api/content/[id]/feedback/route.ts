import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createContentFeedbackSchema } from "@/lib/validators/feedback";

type ContentFeedbackRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: ContentFeedbackRouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createContentFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const current = await db.contentItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const feedback = await db.contentFeedback.create({
    data: {
      userId,
      contentItemId: current.id,
      feedbackType: parsed.data.feedbackType,
      note: parsed.data.note?.trim() || null,
    },
    select: {
      id: true,
      feedbackType: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

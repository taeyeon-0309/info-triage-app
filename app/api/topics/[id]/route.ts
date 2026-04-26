import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { updateTopicSchema } from "@/lib/validators/topic";

type TopicRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: TopicRouteContext) {
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

  const parsed = updateTopicSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const current = await db.topic.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const topic = await db.topic.update({
      where: { id: current.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description === undefined ? undefined : parsed.data.description?.trim() || null,
        priority: parsed.data.priority,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Topic already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: TopicRouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const current = await db.topic.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.topic.delete({
    where: { id: current.id },
  });

  return new NextResponse(null, { status: 204 });
}

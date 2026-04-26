import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createTopicSchema } from "@/lib/validators/topic";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topics = await db.topic.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ topics });
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

  const parsed = createTopicSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const topic = await db.topic.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        priority: parsed.data.priority ?? 50,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Topic already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}

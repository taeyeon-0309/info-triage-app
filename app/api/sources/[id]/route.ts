import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

type SourceRouteContext = {
  params: Promise<{ id: string }>;
};

const updateSourceSchema = z
  .object({
    qualityScore: z.number().int().min(0).max(100).optional(),
    isBlocked: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要一个更新字段",
  });

export async function PATCH(request: Request, context: SourceRouteContext) {
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

  const parsed = updateSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const current = await db.source.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const source = await db.source.update({
    where: { id: current.id },
    data: parsed.data,
  });

  return NextResponse.json({ source });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createContentItem } from "@/lib/repositories/content-repo";
import { createContentSchema } from "@/lib/validators/content";
import type { BatchCreateContentResponse } from "@/lib/types/content";

const batchEnvelopeSchema = z.object({
  items: z.array(z.unknown()).min(1).max(100),
});

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

  const envelope = batchEnvelopeSchema.safeParse(body);

  if (!envelope.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: envelope.error.flatten(),
      },
      { status: 400 },
    );
  }

  const response: BatchCreateContentResponse = {
    successCount: 0,
    failedCount: 0,
    successes: [],
    failures: [],
  };

  for (let index = 0; index < envelope.data.items.length; index += 1) {
    const item = envelope.data.items[index];
    const parsed = createContentSchema.safeParse(item);

    if (!parsed.success) {
      response.failedCount += 1;
      response.failures.push({
        index,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      });
      continue;
    }

    const created = await createContentItem(db, userId, parsed.data);
    response.successCount += 1;
    response.successes.push({
      contentItemId: created.id,
      status: created.status,
      isUrlOnly: created.isUrlOnly,
    });
  }

  const statusCode = response.successCount > 0 ? 200 : 400;
  return NextResponse.json(response, { status: statusCode });
}

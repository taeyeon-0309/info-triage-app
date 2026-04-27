import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function getCurrentUserId(): Promise<string | null> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    if (error instanceof Error && error.message === "Supabase env is missing") {
      return null;
    }
    throw error;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const email = user.email ?? `${user.id}@supabase.local`;
  const name =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

  const appUser = await db.user.upsert({
    where: { id: user.id },
    update: {
      email,
      name,
    },
    create: {
      id: user.id,
      email,
      name,
      preference: {
        create: {},
      },
    },
    select: { id: true },
  });

  return appUser.id;
}

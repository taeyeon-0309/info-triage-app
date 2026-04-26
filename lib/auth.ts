import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

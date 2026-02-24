import { supabase } from "@/lib/supabase";

export async function ensureAnonymousSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    await supabase.auth.signInAnonymously();
  }
}
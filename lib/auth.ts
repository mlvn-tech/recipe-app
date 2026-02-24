import { supabase } from "@/lib/supabase";

export async function ensureAnonymousSession() {
  console.log("ensureAnonymousSession aangeroepen");
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Huidige sessie:", session);
  
  if (!session) {
    console.log("Geen sessie, anoniem inloggen...");
    const { data, error } = await supabase.auth.signInAnonymously();
    console.log("Resultaat:", data, error);
  }
}

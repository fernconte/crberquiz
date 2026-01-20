import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = cookies() as ReturnType<typeof cookies> & {
    set?: (options: { name: string; value: string; [key: string]: unknown }) => void;
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set?.({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set?.({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

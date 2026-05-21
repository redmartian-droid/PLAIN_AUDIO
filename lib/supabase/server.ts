import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: any }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options),
            );
          } catch (e) {
            // Session refresh can fail in some edge cases (e.g., streaming responses)
            // Log in development to catch issues, but don't throw in production
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to set session cookies:", e);
            }
          }
        },
      },
    },
  );
}

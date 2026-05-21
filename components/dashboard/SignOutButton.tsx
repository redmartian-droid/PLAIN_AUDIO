"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors",
        "text-destructive hover:text-destructive/90",
        "border border-destructive/20 hover:border-destructive/30",
        "hover:bg-destructive/10 px-4 py-2 rounded-lg",
      )}
    >
      <LogOut size={13} />
      Sign out
    </button>
  );
}

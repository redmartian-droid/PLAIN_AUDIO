import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.polar_customer_id) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 },
    );
  }

  // Polar customer portal URL
  const portalUrl = `https://sandbox.polar.sh/purchases?customer_id=${profile.polar_customer_id}`;
  return NextResponse.redirect(portalUrl);
}

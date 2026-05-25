import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Validate environment variables at module load time
const requiredEnvVars = [
  "APP_BASE_URL",
  "POLAR_ACCESS_TOKEN",
  "NEXT_PUBLIC_POLAR_PRO_MONTHLY_PRODUCT_ID",
  "NEXT_PUBLIC_POLAR_PRO_ANNUAL_PRODUCT_ID",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get interval from query params (monthly or annual), default to monthly
  const requestUrl = new URL(request.url);
  const interval = requestUrl.searchParams.get("interval") || "monthly";

  if (interval !== "monthly" && interval !== "annual") {
    return NextResponse.json(
      { error: "Invalid interval. Must be 'monthly' or 'annual'." },
      { status: 400 },
    );
  }

  // check if user already has a Polar customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.APP_BASE_URL!;

  // Validate APP_BASE_URL is HTTPS and well-formed
  try {
    const parsedAppUrl = new URL(appUrl);
    if (parsedAppUrl.protocol !== "https:") {
      throw new Error("APP_BASE_URL must use HTTPS");
    }
  } catch (e) {
    console.error("Invalid APP_BASE_URL:", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // Select the correct product ID based on interval
  const productId =
    interval === "annual"
      ? process.env.NEXT_PUBLIC_POLAR_PRO_ANNUAL_PRODUCT_ID
      : process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PRODUCT_ID;

  const body: Record<string, any> = {
    product_id: productId,
    customer_email: user.email,
    success_url: `${appUrl}/dashboard/settings?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/settings?upgraded=0`,
    metadata: {
      supabase_user_id: user.id,
    },
  };

  // If we already have a Polar customer ID, reuse it
  if (profile?.polar_customer_id) {
    body.customer_id = profile.polar_customer_id;
    delete body.customer_email;
  }

  // Determine API endpoint based on environment
  const isProd = process.env.POLAR_ENV === "production";
  const baseUrl = isProd
    ? "https://api.polar.sh"
    : "https://sandbox-api.polar.sh";

  const res = await fetch(`${baseUrl}/v1/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();

    console.error(
      "Polar checkout error:",
      err?.error ?? err?.message ?? "unknown",
    );

    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    );
  }

  const { url: checkoutUrl } = await res.json();

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    console.error("Invalid checkout URL from Polar");
    return NextResponse.json(
      { error: "Invalid checkout response" },
      { status: 502 },
    );
  }

  try {
    const parsedCheckoutUrl = new URL(checkoutUrl);

    const isValidPolarUrl = isProd
      ? parsedCheckoutUrl.hostname === "polar.sh"
      : parsedCheckoutUrl.hostname === "sandbox.polar.sh";

    if (!isValidPolarUrl) {
      console.error(
        "Checkout URL is not from Polar:",
        parsedCheckoutUrl.hostname,
      );

      return NextResponse.json(
        { error: "Invalid checkout URL" },
        { status: 502 },
      );
    }
  } catch {
    console.error("Failed to parse checkout URL");

    return NextResponse.json(
      { error: "Invalid checkout URL format" },
      { status: 502 },
    );
  }

  return NextResponse.redirect(checkoutUrl);
}

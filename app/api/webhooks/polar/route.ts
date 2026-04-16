import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validatePolarWebhook } from "@/lib/polar";

// Use service role for webhook processing
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature") || "";

  // Validate webhook signature
  const isValid = await validatePolarWebhook(rawBody, signature);
  if (!isValid) {
    console.error("Invalid Polar webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = getAdminClient();

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const customerEmail = sub.customer?.email;
        if (!customerEmail) break;

        const isActive = sub.status === "active";

        await supabase
          .from("profiles")
          .update({
            plan: isActive ? "pro" : "free",
            polar_customer_id: sub.customer?.id,
            polar_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          })
          .eq("email", customerEmail);

        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = event.data;
        const customerEmail = sub.customer?.email;
        if (!customerEmail) break;

        await supabase
          .from("profiles")
          .update({
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("email", customerEmail);

        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

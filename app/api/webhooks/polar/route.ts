import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service role key — this runs server-side, bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const event = payload as any;
    const data = event.data;

    // Pull the supabase user ID you stored in metadata at checkout
    const supabaseUserId = data.metadata?.supabase_user_id;

    if (!supabaseUserId) {
      console.error("No supabase_user_id in metadata", data.id);
      return;
    }

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const plan = data.status === "active" ? "pro" : "free";
        const customerId = data.customer_id ?? data.customer?.id ?? null;

        const { error } = await supabase
          .from("profiles")
          .update({
            plan,
            polar_customer_id: customerId,
            polar_subscription_id: data.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", supabaseUserId);

        if (error) console.error("Failed to update profile:", error);
        else
          console.log(`${supabaseUserId} → ${plan} | customer: ${customerId}`);
        break;
      }

      case "subscription.canceled": {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: "free",
            polar_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", supabaseUserId);

        if (error) console.error("Failed to downgrade profile:", error);
        else console.log(`${supabaseUserId} → free (canceled)`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  },
});

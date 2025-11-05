import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { recipientUserId, title, body, icon, data } = await req.json();

    console.log("📨 Sending Web Push notification to user:", recipientUserId);

    // Recupera le subscription salvate
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", recipientUserId);

    if (error) throw error;

    if (!subscriptions?.length) {
      console.log("⚠️ No push subscriptions found for user");
      return new Response(
        JSON.stringify({
          success: false,
          message: "No push subscriptions found for user",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📱 Found ${subscriptions.length} subscriptions`);

    // Configura VAPID
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail =
      Deno.env.get("VAPID_EMAIL") || "mailto:agrotecnicomarconigro@gmail.com";

    if (!vapidPublic || !vapidPrivate) {
      throw new Error("Missing VAPID keys in environment variables");
    }

    webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

    // Payload della notifica
    const payload = JSON.stringify({
      title: title || "Dr.Plant",
      body: body || "Nuovo messaggio ricevuto",
      icon:
        icon ||
        "/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png",
      data: data || {},
      timestamp: Date.now(),
      requireInteraction: true,
    });

    let successCount = 0;
    let failureCount = 0;

    for (const sub of subscriptions) {
      try {
        const parsedSub = JSON.parse(sub.subscription);

        await webpush.sendNotification(parsedSub, payload);
        successCount++;
        console.log("✅ Push sent successfully");
      } catch (err) {
        console.error("❌ Error sending push:", err);
        failureCount++;
        // Se subscription scaduta o non valida
        if (err.statusCode === 410 || err.statusCode === 404) {
          const endpoint = JSON.parse(sub.subscription)?.endpoint;
          if (endpoint) {
            console.log("🗑️ Removing expired subscription:", endpoint);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("subscription->>endpoint", endpoint);
          }
        }
      }
    }

    console.log(
      `📊 Push result: ${successCount} success, ${failureCount} failed`
    );

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        results: { successCount, failureCount },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Web Push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

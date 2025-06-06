
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createUserNotification, getUserSettings } from "../_shared/user-utils.ts";

interface NotificationPayload {
  userId: string;
  diagnosisId: string;
  plantType: string;
  isHealthy: boolean;
  confidence: number;
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { userId, diagnosisId, plantType, isHealthy, confidence } = await req.json() as NotificationPayload;
    
    if (!userId || !diagnosisId) {
      throw new Error("userId and diagnosisId are required");
    }
    
    // Get user settings
    const userSettings = await getUserSettings(userId);
    
    if (!userSettings.notificationsEnabled) {
      console.log("Notifications disabled for user:", userId);
      return new Response(
        JSON.stringify({ success: true, message: "Notifications disabled for user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create the notification
    const title = isHealthy 
      ? `La tua pianta ${plantType} è sana!` 
      : `Diagnosi disponibile per ${plantType}`;
      
    const message = isHealthy 
      ? `Abbiamo analizzato la tua pianta con ${Math.round(confidence * 100)}% di sicurezza e sembra sana.` 
      : `Abbiamo completato l'analisi della tua pianta. Consulta i risultati.`;
    
    const success = await createUserNotification(
      userId,
      title,
      message,
      "diagnosis",
      { diagnosisId, plantType, isHealthy, confidence }
    );
    
    if (!success) {
      throw new Error("Failed to create notification");
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending diagnosis notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

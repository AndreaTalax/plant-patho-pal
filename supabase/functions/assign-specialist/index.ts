import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosisId, plantType, severity } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🏥 Assigning specialist for:', { diagnosisId, plantType, severity });

    // Default expert ID (Marco Nigro)
    const expertId = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';
    
    // Update diagnosis with assigned specialist
    const { error: updateError } = await supabase
      .from("consultations")
      .update({ 
        expert_id: expertId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq("id", diagnosisId);

    if (updateError) {
      console.error('❌ Error updating diagnosis:', updateError);
      throw updateError;
    }

    // Create notification for the specialist
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: expertId,
        title: 'Nuova Assegnazione',
        message: `Nuova consultazione assegnata per ${plantType || 'pianta'} (Gravità: ${severity})`,
        type: 'specialist_assignment',
        data: {
          diagnosisId,
          plantType,
          severity
        }
      });

    if (notificationError) {
      console.warn('⚠️ Error creating notification:', notificationError);
    }

    console.log('✅ Specialist assigned successfully');

    return new Response(JSON.stringify({ 
      success: true,
      expertId,
      diagnosisId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error in assign-specialist:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to assign specialist'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
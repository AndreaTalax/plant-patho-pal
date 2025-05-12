
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PYTHON_API_URL = Deno.env.get('PYTHON_API_URL') || "http://localhost:8000";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a multipart/form-data request
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Request must be multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward the request to the Python API
    console.log(`Forwarding request to Python API: ${PYTHON_API_URL}/predict`);
    
    // Clone the request and forward it
    const formData = await req.formData();
    const response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    // Get the response from the Python API
    const data = await response.json();
    console.log('Python API response:', data);

    // Return the response
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in plant-diagnosis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

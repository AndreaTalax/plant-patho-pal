
import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

// Supabase project details
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Bridge function to invoke Supabase edge functions from the browser
 */
export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    // Parse the request body
    const { functionName, payload } = JSON.parse(event.body || "{}");
    
    if (!functionName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Function name is required" })
      };
    }
    
    console.log(`Invoking Supabase function: ${functionName}`);
    
    // Call the Supabase edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    // Get the response data
    const data = await response.json();
    
    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Error invoking Supabase function:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to invoke function" })
    };
  }
};

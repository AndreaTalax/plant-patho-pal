
import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

// API credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY || "";
const HUGGINGFACE_ACCESS_TOKEN = process.env.HUGGINGFACE_ACCESS_TOKEN || "";
const EPPO_API_KEY = process.env.EPPO_API_KEY || "";

export const handler: Handler = async (event) => {
  // Get the path parameters
  const path = event.path.replace(/^\/\.netlify\/functions\/api-router\//, "");
  const segments = path.split("/");
  const resource = segments[0];
  const method = segments[1];
  
  console.log(`API Router: ${event.httpMethod} ${path}`);

  try {
    // Configure CORS for responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ""
      };
    }

    // Handle different API resources
    switch (resource) {
      case "plants":
        return handlePlantRequests(event, corsHeaders);
        
      case "conversations":
        return handleConversationRequests(event, corsHeaders);
        
      case "messages":
        return handleMessageRequests(event, corsHeaders);
        
      case "user":
        return handleUserRequests(event, corsHeaders);
        
      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Resource not found" })
        };
    }
  } catch (error) {
    console.error("API Router error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};

// Handle requests to /plants endpoints
async function handlePlantRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  const segments = event.path.replace(/^\/\.netlify\/functions\/api-router\/plants\//, "").split("/");
  const action = segments[0];
  
  if (action === "analyze") {
    if (method === "POST") {
      try {
        const payload = JSON.parse(event.body || "{}");
        const { imageData, plantInfo, userId } = payload;
        
        if (!imageData) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Image data is required" })
          };
        }
        
        // Call the plant-diagnosis edge function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/plant-diagnosis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            imageData,
            plantInfo,
            userId
          })
        });
        
        const result = await response.json();
        
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify(result)
        };
      } catch (error) {
        console.error("Error in plant analysis:", error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Failed to analyze plant" })
        };
      }
    } else if (method === "GET") {
      // Handle GET request to retrieve user diagnoses
      const userId = event.queryStringParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId is required" })
        };
      }
      
      try {
        // Call Supabase directly to retrieve diagnoses
        const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?user_id=eq.${userId}&order=created_at.desc`, {
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "apikey": SUPABASE_SERVICE_ROLE_KEY
          }
        });
        
        if (!response.ok) {
          throw new Error(`Supabase error: ${response.status}`);
        }
        
        const diagnoses = await response.json();
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(diagnoses)
        };
      } catch (error) {
        console.error("Error fetching diagnoses:", error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Failed to fetch diagnoses" })
        };
      }
    }
  }
  
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Endpoint not found" })
  };
}

// Handle requests to /conversations endpoints
async function handleConversationRequests(event: any, corsHeaders: any) {
  // Implementation for conversations API
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: "Conversations endpoint" })
  };
}

// Handle requests to /messages endpoints
async function handleMessageRequests(event: any, corsHeaders: any) {
  // Implementation for messages API
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: "Messages endpoint" })
  };
}

// Handle requests to /user endpoints
async function handleUserRequests(event: any, corsHeaders: any) {
  // Implementation for user API
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: "User endpoint" })
  };
}

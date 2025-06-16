import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

// API credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY || "";
const HUGGINGFACE_ACCESS_TOKEN = process.env.HUGGINGFACE_ACCESS_TOKEN || "";
const EPPO_API_KEY = process.env.EPPO_API_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";

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
      case "profiles":
        return handleUserRequests(event, corsHeaders);

      case "consultations":
        return handleConsultationRequests(event, corsHeaders);

      case "diagnoses":
        return handleDiagnosesRequests(event, corsHeaders);

      case "notifications":
        return handleNotificationRequests(event, corsHeaders);

      case "products":
        return handleProductRequests(event, corsHeaders);

      case "orders":
        return handleOrderRequests(event, corsHeaders);

      case "library":
        return handleLibraryRequests(event, corsHeaders);

      case "upload-avatar":
        return handleAvatarUpload(event, corsHeaders);
        
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
  const method = event.httpMethod;
  
  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    const expertId = event.queryStringParameters?.expertId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "userId is required" })
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/conversations?user_id=eq.${userId}&order=last_message_at.desc`, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const conversations = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(conversations)
      };
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch conversations" })
      };
    }
  }

  if (method === "POST") {
    try {
      const { userId, expertId, title } = JSON.parse(event.body || "{}");
      
      if (!userId || !expertId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId and expertId are required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          expert_id: expertId,
          title: title || "Consulenza esperto",
          status: "active"
        })
      });

      const conversation = await response.json();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(conversation)
      };
    } catch (error) {
      console.error("Error creating conversation:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to create conversation" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /messages endpoints
async function handleMessageRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const conversationId = event.queryStringParameters?.conversationId;
    
    if (!conversationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "conversationId is required" })
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=sent_at.asc`, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const messages = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(messages)
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch messages" })
      };
    }
  }

  if (method === "POST") {
    try {
      const { conversationId, senderId, recipientId, text, products } = JSON.parse(event.body || "{}");
      
      if (!conversationId || !senderId || !recipientId || !text) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Missing required fields" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          content: text,
          text: text,
          products: products || null
        })
      });

      const message = await response.json();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(message)
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to send message" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /user and /profiles endpoints
async function handleUserRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "userId is required" })
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const profiles = await response.json();
      const profile = profiles[0] || null;
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(profile)
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch profile" })
      };
    }
  }

  if (method === "PUT") {
    try {
      const { userId, profileData } = JSON.parse(event.body || "{}");
      
      if (!userId || !profileData) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId and profileData are required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(profileData)
      });

      const profile = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(profile)
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to update profile" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /consultations endpoints
async function handleConsultationRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    const expertId = event.queryStringParameters?.expertId;
    const status = event.queryStringParameters?.status;
    
    try {
      let url = `${SUPABASE_URL}/rest/v1/expert_consultations?order=created_at.desc`;
      
      if (userId) url += `&user_id=eq.${userId}`;
      if (expertId) url += `&expert_id=eq.${expertId}`;
      if (status) url += `&status=eq.${status}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const consultations = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(consultations)
      };
    } catch (error) {
      console.error("Error fetching consultations:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch consultations" })
      };
    }
  }

  if (method === "POST") {
    try {
      const { userId, plantInfo, symptoms, imageUrl } = JSON.parse(event.body || "{}");
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId is required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/expert_consultations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          plant_info: plantInfo,
          symptoms,
          image_url: imageUrl,
          status: "pending"
        })
      });

      const consultation = await response.json();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(consultation)
      };
    } catch (error) {
      console.error("Error creating consultation:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to create consultation" })
      };
    }
  }

  if (method === "PUT") {
    try {
      const { consultationId, status, response: consultationResponse } = JSON.parse(event.body || "{}");
      
      if (!consultationId || !status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "consultationId and status are required" })
        };
      }

      const updateData: any = { status };
      if (consultationResponse) {
        updateData.response = consultationResponse;
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/expert_consultations?id=eq.${consultationId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      const consultation = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(consultation)
      };
    } catch (error) {
      console.error("Error updating consultation:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to update consultation" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /diagnoses endpoints
async function handleDiagnosesRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    const diagnosisId = event.queryStringParameters?.diagnosisId;
    
    try {
      let url = `${SUPABASE_URL}/rest/v1/diagnoses?order=created_at.desc`;
      
      if (diagnosisId) {
        url = `${SUPABASE_URL}/rest/v1/diagnoses?id=eq.${diagnosisId}`;
      } else if (userId) {
        url += `&user_id=eq.${userId}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const diagnoses = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(diagnosisId ? diagnoses[0] || null : diagnoses)
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

  if (method === "POST") {
    try {
      const { userId, plantType, plantVariety, symptoms, imageUrl, diagnosisResult } = JSON.parse(event.body || "{}");
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId is required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          plant_type: plantType,
          plant_variety: plantVariety,
          symptoms,
          image_url: imageUrl,
          diagnosis_result: diagnosisResult,
          status: "completed"
        })
      });

      const diagnosis = await response.json();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(diagnosis)
      };
    } catch (error) {
      console.error("Error saving diagnosis:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to save diagnosis" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /notifications endpoints
async function handleNotificationRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    const unreadOnly = event.queryStringParameters?.unreadOnly === "true";
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "userId is required" })
      };
    }

    try {
      let url = `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}&order=created_at.desc`;
      
      if (unreadOnly) {
        url += "&read=eq.false";
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const notifications = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(notifications)
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch notifications" })
      };
    }
  }

  if (method === "POST") {
    try {
      const { userId, title, message, type, data } = JSON.parse(event.body || "{}");
      
      if (!userId || !title || !message) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "userId, title, and message are required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          message,
          type: type || "general",
          data: data || null,
          read: false
        })
      });

      const notification = await response.json();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(notification)
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to create notification" })
      };
    }
  }

  if (method === "PUT") {
    try {
      const { notificationId, read } = JSON.parse(event.body || "{}");
      
      if (!notificationId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "notificationId is required" })
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          read: read !== undefined ? read : true
        })
      });

      const notification = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(notification)
      };
    } catch (error) {
      console.error("Error updating notification:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to update notification" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /products endpoints
async function handleProductRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "GET") {
    const category = event.queryStringParameters?.category;
    const search = event.queryStringParameters?.search;
    
    try {
      let url = `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&order=created_at.desc`;
      
      if (category) url += `&category=eq.${category}`;
      if (search) url += `&name=ilike.*${search}*`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const products = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(products)
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch products" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /orders endpoints
async function handleOrderRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  const segments = event.path.replace(/^\/\.netlify\/functions\/api-router\/orders\//, "").split("/");
  const action = segments[0];
  
  if (action === "create-payment" && method === "POST") {
    try {
      const { items, successUrl, cancelUrl } = JSON.parse(event.body || "{}");
      
      if (!items || !successUrl || !cancelUrl) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "items, successUrl, and cancelUrl are required" })
        };
      }

      // Call Stripe API to create checkout session
      const stripe = require('stripe')(STRIPE_SECRET_KEY);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map((item: any) => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              description: item.description || '',
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity || 1,
        })),
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          sessionId: session.id,
          url: session.url 
        })
      };
    } catch (error) {
      console.error("Error creating payment:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to create payment" })
      };
    }
  }

  if (action === "verify-payment" && method === "POST") {
    try {
      const { sessionId } = JSON.parse(event.body || "{}");
      
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "sessionId is required" })
        };
      }

      const stripe = require('stripe')(STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          status: session.payment_status,
          session 
        })
      };
    } catch (error) {
      console.error("Error verifying payment:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to verify payment" })
      };
    }
  }

  if (method === "GET") {
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "userId is required" })
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY
        }
      });

      const orders = await response.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(orders)
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to fetch orders" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

// Handle requests to /library endpoints
async function handleLibraryRequests(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  const segments = event.path.replace(/^\/\.netlify\/functions\/api-router\/library\//, "").split("/");
  const resource = segments[0];
  const articleId = segments[1];
  
  if (resource === "articles") {
    if (method === "GET") {
      if (articleId) {
        // Get single article
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/library_articles?id=eq.${articleId}&is_published=eq.true`, {
            headers: {
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "apikey": SUPABASE_SERVICE_ROLE_KEY
            }
          });

          const articles = await response.json();
          const article = articles[0] || null;
          
          return {
            statusCode: article ? 200 : 404,
            headers: corsHeaders,
            body: JSON.stringify(article)
          };
        } catch (error) {
          console.error("Error fetching article:", error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Failed to fetch article" })
          };
        }
      } else {
        // Get articles list
        const category = event.queryStringParameters?.category;
        const search = event.queryStringParameters?.search;
        
        try {
          let url = `${SUPABASE_URL}/rest/v1/library_articles?is_published=eq.true&order=created_at.desc`;
          
          if (category) url += `&category=eq.${category}`;
          if (search) url += `&title=ilike.*${search}*`;

          const response = await fetch(url, {
            headers: {
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "apikey": SUPABASE_SERVICE_ROLE_KEY
            }
          });

          const articles = await response.json();
          
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(articles)
          };
        } catch (error) {
          console.error("Error fetching articles:", error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Failed to fetch articles" })
          };
        }
      }
    }
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Resource not found" })
  };
}

// Handle avatar upload
async function handleAvatarUpload(event: any, corsHeaders: any) {
  const method = event.httpMethod;
  
  if (method === "POST") {
    try {
      // This would typically handle file upload to Supabase Storage
      // For now, return a placeholder response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: "Avatar upload endpoint - implementation needed for file processing",
          url: "placeholder-avatar-url"
        })
      };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to upload avatar" })
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}

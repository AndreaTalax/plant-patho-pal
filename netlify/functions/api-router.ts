import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route handler
    switch (path) {
      case '/api/plants/analyze':
        return await handlePlantAnalysis(req, supabase);
      
      case '/api/conversations':
        return await handleConversations(req, supabase);
      
      case '/api/messages':
        return await handleMessages(req, supabase);
      
      case '/api/consultations':
        return await handleConsultations(req, supabase);
      
      case '/api/profiles':
        return await handleProfiles(req, supabase);
      
      case '/api/notifications':
        return await handleNotifications(req, supabase);
      
      case '/api/diagnoses':
        return await handleDiagnoses(req, supabase);
      
      case '/api/products':
        return await handleProducts(req, supabase);
      
      case '/api/orders':
        return await handleOrders(req, supabase);
      
      case '/api/orders/create-payment':
        return await handleCreatePayment(req, supabase);
      
      case '/api/orders/verify-payment':
        return await handleVerifyPayment(req, supabase);
      
      case '/api/library/articles':
        return await handleLibraryArticles(req, supabase);
      
      case '/api/upload-avatar':
        return await handleUploadAvatar(req, supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('API Router Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Plant Analysis Endpoints
async function handlePlantAnalysis(req: Request, supabase: any) {
  if (req.method === 'POST') {
    const { imageData, plantInfo, userId } = await req.json();
    
    // Call existing plant analysis function
    const analysisResult = await supabase.functions.invoke('analyze-plant', {
      body: { imageData, plantInfo, userId }
    });
    
    if (analysisResult.error) {
      throw new Error(analysisResult.error.message);
    }
    
    return new Response(
      JSON.stringify(analysisResult.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data, error } = await supabase
      .from('diagnosi_piante')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ diagnoses: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Conversations Endpoints
async function handleConversations(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const expertId = url.searchParams.get('expertId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let query = supabase
      .from('conversations')
      .select('*, user:user_id(id, username, first_name, last_name), expert:expert_id(id, username, first_name, last_name)')
      .order('updated_at', { ascending: false });
    
    if (expertId) {
      query = query.eq('expert_id', expertId);
    } else {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ conversations: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'POST') {
    const { userId, expertId, title } = await req.json();
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        expert_id: expertId,
        title: title || 'Nuova conversazione',
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ conversation: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Messages Endpoints
async function handleMessages(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ messages: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'POST') {
    const { conversationId, senderId, recipientId, text, products } = await req.json();
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        text: text,
        products: products || null,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    return new Response(
      JSON.stringify({ message: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Consultations Endpoints
async function handleConsultations(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const expertId = url.searchParams.get('expertId');
    const status = url.searchParams.get('status');
    
    let query = supabase
      .from('expert_consultations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) query = query.eq('user_id', userId);
    if (expertId) query = query.eq('expert_id', expertId);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ consultations: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'POST') {
    const { userId, plantInfo, symptoms, imageUrl } = await req.json();
    
    const { data, error } = await supabase
      .from('expert_consultations')
      .insert({
        user_id: userId,
        plant_info: plantInfo,
        symptoms: symptoms,
        image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ consultation: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'PUT') {
    const { consultationId, status, response } = await req.json();
    
    const updateData: any = { status };
    if (response) updateData.response = response;
    
    const { data, error } = await supabase
      .from('expert_consultations')
      .update(updateData)
      .eq('id', consultationId)
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ consultation: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Profiles Endpoints
async function handleProfiles(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ profile: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'PUT') {
    const { userId, profileData } = await req.json();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ profile: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Notifications Endpoints
async function handleNotifications(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ notifications: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'POST') {
    const { userId, title, message, type, data } = await req.json();
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type || 'general',
        data: data || null,
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ notification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'PUT') {
    const { notificationId, read } = await req.json();
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: read })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ notification: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Diagnoses Endpoints
async function handleDiagnoses(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const diagnosisId = url.searchParams.get('diagnosisId');
    
    if (diagnosisId) {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('id', diagnosisId)
        .single();
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ diagnosis: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ diagnoses: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (req.method === 'POST') {
    const { userId, plantType, plantVariety, symptoms, imageUrl, diagnosisResult } = await req.json();
    
    const { data, error } = await supabase
      .from('diagnoses')
      .insert({
        user_id: userId,
        plant_type: plantType,
        plant_variety: plantVariety,
        symptoms: symptoms,
        image_url: imageUrl,
        diagnosis_result: diagnosisResult,
        status: 'completed'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ diagnosis: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// New Products Endpoints
async function handleProducts(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ products: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Orders Endpoints
async function handleOrders(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ orders: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Create Payment Endpoint
async function handleCreatePayment(req: Request, supabase: any) {
  if (req.method === 'POST') {
    // Redirect to the Supabase function
    const response = await supabase.functions.invoke('create-payment', {
      body: await req.json(),
      headers: {
        Authorization: req.headers.get('Authorization') || ''
      }
    });
    
    if (response.error) throw new Error(response.error.message);
    
    return new Response(
      JSON.stringify(response.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify Payment Endpoint
async function handleVerifyPayment(req: Request, supabase: any) {
  if (req.method === 'POST') {
    // Redirect to the Supabase function
    const response = await supabase.functions.invoke('verify-payment', {
      body: await req.json()
    });
    
    if (response.error) throw new Error(response.error.message);
    
    return new Response(
      JSON.stringify(response.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Library Articles Endpoints
async function handleLibraryArticles(req: Request, supabase: any) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const articleId = url.searchParams.get('id');
    
    if (articleId) {
      // Get single article
      const { data, error } = await supabase
        .from('library_articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ article: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get multiple articles
    let query = supabase
      .from('library_articles')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ articles: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Upload Avatar Endpoint
async function handleUploadAvatar(req: Request, supabase: any) {
  if (req.method === 'POST') {
    // Redirect to the Supabase function
    const response = await supabase.functions.invoke('upload-avatar', {
      body: await req.formData(),
      headers: {
        Authorization: req.headers.get('Authorization') || ''
      }
    });
    
    if (response.error) throw new Error(response.error.message);
    
    return new Response(
      JSON.stringify(response.data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

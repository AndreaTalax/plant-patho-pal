
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get user profile by ID
export const getUserProfile = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
    
  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  return data;
};

// Create a notification for user
export const createUserNotification = async (
  userId: string,
  title: string,
  message: string,
  type = "diagnosis",
  data: any = {}
) => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      data,
      read: false
    });
    
  if (error) {
    console.error("Error creating notification:", error);
    return false;
  }
  
  return true;
};

// Get user settings
export const getUserSettings = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      userId,
      email: data?.email || "",
      firstName: data?.first_name || "",
      lastName: data?.last_name || "",
      notificationsEnabled: true, // Default to true if setting not found
      language: "it" // Default language
    };
  } catch (error) {
    console.error("Error getting user settings:", error);
    return {
      userId,
      notificationsEnabled: true,
      language: "it"
    };
  }
};

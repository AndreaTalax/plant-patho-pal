
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
/**
 * Fetches user profile data from the Supabase database.
 * @example
 * sync('12345')
 * { id: '12345', name: 'John Doe', email: 'john.doe@example.com' }
 * @param {string} userId - The unique identifier of the user whose profile is to be fetched.
 * @returns {Object|null} The user's profile data object or null if an error occurred.
 * @description
 *   - Uses Supabase client to query the "profiles" table based on user ID.
 *   - Handles errors by logging them to the console.
 *   - Retrieves only one user profile by using the `.single()` method.
 */
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
/**
* Creates a new notification for a user in the database.
* @example
* sync('123', 'Appointment Reminder', 'You have an appointment tomorrow', 'reminder', { date: '2023-10-10' })
* true
* @param {string} userId - The ID of the user to whom the notification is sent.
* @param {string} title - The title of the notification.
* @param {string} message - The content of the notification message.
* @param {string} [type="diagnosis"] - The type of notification.
* @param {any} [data={}] - Additional data related to the notification.
* @returns {boolean} Returns true if the notification was created successfully, and false if there was an error.
* @description
*   - Uses Supabase client to interact with the 'notifications' table.
*   - Automatically sets the 'read' status of the notification to false upon creation.
*/
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
/**
 * Retrieves user settings from the Supabase database based on user ID.
 * @example
 * sync('12345')
 * // returns a user settings object for the given user ID
 * @param {string} userId - The unique identifier of the user whose settings are being retrieved.
 * @returns {Object} An object containing user settings: userId, email, firstName, lastName, notificationsEnabled, and language.
 * @description
 *   - Defaults to empty strings for email, firstName, and lastName if not found in the database.
 *   - Sets notificationsEnabled to true by default.
 *   - Uses "it" (Italian) as the default language for the user's settings.
 *   - Logs errors to the console if there is an issue retrieving data from the database.
 */
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

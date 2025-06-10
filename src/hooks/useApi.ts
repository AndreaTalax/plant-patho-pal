
import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

// Custom hook for API calls with loading and error handling
/**
 * Calls an API function and manages loading, errors, and optional toast notifications.
 * @example
 * callApi(() => fetchData(), { successMessage: "Fetch successful!", errorMessage: "Fetch failed!" })
 * { loading: false, error: null, callApi: [Function] }
 * @param {() => Promise<any>} apiCall - A function that returns a promise, representing the API call.
 * @param {Object} options - Options for handling success, error messages, and toast visibility.
 * @param {string} [options.successMessage] - Optional message to display on a successful API call.
 * @param {string} [options.errorMessage] - Optional message to display if an error occurs during the API call.
 * @param {boolean} [options.showToast=true] - Flag to determine if toast notifications should be shown.
 * @returns {Object} An object containing the state of loading, error status, and the API call function.
 * @description
 *   - Utilizes React's useState and useCallback hooks to manage and memoize states.
 *   - Displays toast notifications through a third-party library.
 *   - Provides detailed error messages using the JavaScript Error object.
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = useCallback(async (apiCall: () => Promise<any>, options: {
    successMessage?: string;
    errorMessage?: string;
    showToast?: boolean;
  } = {}) => {
    const { successMessage, errorMessage, showToast = true } = options;
    
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (successMessage && showToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Si è verificato un errore';
      setError(errorMsg);
      
      if (showToast) {
        toast.error(errorMessage || errorMsg);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, callApi };
};

// Specific API hooks for different endpoints
/**
* Hook to perform API calls related to plant analysis and retrieving user diagnoses.
* @example
* const { analyzePlant, getUserDiagnoses } = useApiHook();
* analyzePlant(imageData, plantInfo, userId);
* // Returns promise resolving to success/error messages for plant analysis.
* @param {string} imageData - Base64 encoded image data of the plant.
* @param {any} plantInfo - Information related to the plant being analyzed.
* @param {string} userId - Unique identifier for the user associated with the plant analysis.
* @returns {Promise<Object>} Object containing loading state, error, and callable functions for plant analysis and user diagnoses retrieval.
* @description
*   - Utilizes `useApi` hook for network request handling, including loading and error management.
*   - Uses `useCallback` to memoize the API call functions for optimized performance.
*   - Provides customizable feedback through success and error messages for plant analysis results.
*   - The `getUserDiagnoses` function optionally suppresses toast notifications based on internal configuration.
*/
export const usePlantAnalysisApi = () => {
  const { loading, error, callApi } = useApi();

  const analyzePlant = useCallback(async (imageData: string, plantInfo: any, userId: string) => {
    return callApi(
      () => apiClient.analyzePlant(imageData, plantInfo, userId),
      { 
        successMessage: 'Analisi della pianta completata!',
        errorMessage: 'Errore durante l\'analisi della pianta'
      }
    );
  }, [callApi]);

  const getUserDiagnoses = useCallback(async (userId: string) => {
    return callApi(
      () => apiClient.getUserDiagnoses(userId),
      { showToast: false }
    );
  }, [callApi]);

  return { loading, error, analyzePlant, getUserDiagnoses };
};

/**
 * Hook to manage conversation-related API calls.
 * @example
 * useApi().getConversations('userId', 'expertId')
 * // returns conversations related to specific user and expert.
 * @example
 * useApi().createConversation('userId', 'expertId', 'title')
 * // creates a new conversation and returns its status.
 * @param {string} userId - The ID of the user for which to get or create conversations.
 * @param {string} [expertId] - Optional ID of the expert related to the conversation. 
 * @returns {Object} An object containing loading state, error state, and methods for conversation management.
 * @description
 *   - The getConversations method retrieves conversations for the given user and optional expert.
 *   - The createConversation method initiates a conversation between user and expert, optionally with a title.
 *   - Uses custom API client and returns API call status.
 */
export const useConversationsApi = () => {
  const { loading, error, callApi } = useApi();

  const getConversations = useCallback(async (userId: string, expertId?: string) => {
    return callApi(
      () => apiClient.getConversations(userId, expertId),
      { showToast: false }
    );
  }, [callApi]);

  const createConversation = useCallback(async (userId: string, expertId: string, title?: string) => {
    return callApi(
      () => apiClient.createConversation(userId, expertId, title),
      { 
        successMessage: 'Conversazione creata!',
        errorMessage: 'Errore durante la creazione della conversazione'
      }
    );
  }, [callApi]);

  return { loading, error, getConversations, createConversation };
};

/**
 * Provides hooks for API operations related to message exchanges within a conversation.
 * @example
 * useApi().getMessages(conversationId)
 * Returns messages in the specified conversation.
 * @example
 * useApi().sendMessage(conversationId, senderId, recipientId, text, products)
 * Sends a message to a specified recipient in a conversation.
 * @param {string} conversationId - The unique identifier for the conversation.
 * @param {string} senderId - The unique identifier for the sender of the message.
 * @param {string} recipientId - The unique identifier for the recipient of the message.
 * @param {string} text - The text content of the message to be sent.
 * @param {any[]} [products] - Optional list of products associated with the message.
 * @returns {object} Returns an object containing loading status, error status, and two functions to handle message fetching and sending.
 * @description
 *   - Utilizes `useApi` custom hook to manage loading and error states effectively.
 *   - `getMessages` fetches messages without triggering UI toast notifications.
 *   - `sendMessage` includes error handling with a custom error message, but avoids UI toast notifications as these are managed within the chat UI.
 */
export const useMessagesApi = () => {
  const { loading, error, callApi } = useApi();

  const getMessages = useCallback(async (conversationId: string) => {
    return callApi(
      () => apiClient.getMessages(conversationId),
      { showToast: false }
    );
  }, [callApi]);

  const sendMessage = useCallback(async (conversationId: string, senderId: string, recipientId: string, text: string, products?: any[]) => {
    return callApi(
      () => apiClient.sendMessage(conversationId, senderId, recipientId, text, products),
      { 
        errorMessage: 'Errore durante l\'invio del messaggio',
        showToast: false // Usually handled by chat UI
      }
    );
  }, [callApi]);

  return { loading, error, getMessages, sendMessage };
};

/**
 * Provides functions to interact with consultation-related API endpoints.
 * @example
 * const { getConsultations, createConsultation, updateConsultation } = useConsultationActions();
 * const consultations = await getConsultations({ userId: '123' });
 * @param {Object} filters - Optional filters to apply when retrieving consultations. Includes userId, expertId, and status.
 * @returns {Object} An object containing consultation actions: loading state, error state, and API functions: getConsultations, createConsultation, and updateConsultation.
 * @description
 *   - Uses the custom hook `useApi` for API handling.
 *   - Includes success and error messages for user feedback during API interactions.
 *   - Filters in `getConsultations` are optional and can be used to narrow down the search results.
 */
export const useConsultationsApi = () => {
  const { loading, error, callApi } = useApi();

  const getConsultations = useCallback(async (filters: { userId?: string; expertId?: string; status?: string } = {}) => {
    return callApi(
      () => apiClient.getConsultations(filters),
      { showToast: false }
    );
  }, [callApi]);

  const createConsultation = useCallback(async (userId: string, plantInfo: any, symptoms: string, imageUrl?: string) => {
    return callApi(
      () => apiClient.createConsultation(userId, plantInfo, symptoms, imageUrl),
      { 
        successMessage: 'Consultazione creata!',
        errorMessage: 'Errore durante la creazione della consultazione'
      }
    );
  }, [callApi]);

  const updateConsultation = useCallback(async (consultationId: string, status: string, response?: string) => {
    return callApi(
      () => apiClient.updateConsultation(consultationId, status, response),
      { 
        successMessage: 'Consultazione aggiornata!',
        errorMessage: 'Errore durante l\'aggiornamento della consultazione'
      }
    );
  }, [callApi]);

  return { loading, error, getConsultations, createConsultation, updateConsultation };
};

/**
 * Manage API calls related to user profile.
 * @example
 * const { loading, error, getProfile, updateProfile } = useApi();
 * getProfile('12345'); // fetches profile data
 * updateProfile('12345', { name: 'New Name' }); // updates profile data
 * @param {string} userId - Unique identifier of the user profile.
 * @param {any} profileData - Data object containing user profile information to be updated.
 * @returns {Object} - An object containing loading, error states, and methods for profile management.
 * @description
 *   - Uses `useApi` hook to manage loading and error states during API operations.
 *   - Returns asynchronous functions `getProfile` and `updateProfile` to interact with the user profile.
 *   - `getProfile` fetches profile details without displaying a toast notification.
 *   - `updateProfile` provides custom messages for success and error states.
 */
export const useProfileApi = () => {
  const { loading, error, callApi } = useApi();

  const getProfile = useCallback(async (userId: string) => {
    return callApi(
      () => apiClient.getProfile(userId),
      { showToast: false }
    );
  }, [callApi]);

  const updateProfile = useCallback(async (userId: string, profileData: any) => {
    return callApi(
      () => apiClient.updateProfile(userId, profileData),
      { 
        successMessage: 'Profilo aggiornato!',
        errorMessage: 'Errore durante l\'aggiornamento del profilo'
      }
    );
  }, [callApi]);

  return { loading, error, getProfile, updateProfile };
};

/**
 * Provides functions to handle notifications including fetching, creating, and marking them as read.
 * @example
 * const { getNotifications, createNotification, markNotificationAsRead } = useApi();
 * getNotifications('user123')
 * markNotificationAsRead('notif456')
 * @param {string} userId - The ID of the user for whom notifications are being managed.
 * @param {boolean} unreadOnly - Flag to filter only unread notifications. Defaults to false.
 * @param {string} notificationId - The ID of the notification to be marked as read.
 * @param {string} title - The title of the notification to be created.
 * @param {string} message - The message of the notification to be created.
 * @param {string} type - Optional type of the notification to be created.
 * @param {any} data - Optional data associated with the notification to be created.
 * @returns {Promise<any>} Resolves with the API call results for managing notifications.
 * @description
 *   - Utilizes an `apiClient` to perform API requests related to notifications.
 *   - Uses `useCallback` to memoize API call functions for notifications.
 *   - Provides loading and error states from the `useApi` hook.
 */
export const useNotificationsApi = () => {
  const { loading, error, callApi } = useApi();

  const getNotifications = useCallback(async (userId: string, unreadOnly = false) => {
    return callApi(
      () => apiClient.getNotifications(userId, unreadOnly),
      { showToast: false }
    );
  }, [callApi]);

  const createNotification = useCallback(async (userId: string, title: string, message: string, type?: string, data?: any) => {
    return callApi(
      () => apiClient.createNotification(userId, title, message, type, data),
      { 
        successMessage: 'Notifica creata!',
        errorMessage: 'Errore durante la creazione della notifica'
      }
    );
  }, [callApi]);

  const markNotificationAsRead = useCallback(async (notificationId: string, read = true) => {
    return callApi(
      () => apiClient.markNotificationAsRead(notificationId, read),
      { showToast: false }
    );
  }, [callApi]);

  return { loading, error, getNotifications, createNotification, markNotificationAsRead };
};

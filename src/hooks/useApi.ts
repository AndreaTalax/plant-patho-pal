
import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

// Custom hook for API calls with loading and error handling
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

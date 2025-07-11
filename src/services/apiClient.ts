
// Client-side API service for interacting with backend endpoints
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions' 
      : '/.netlify/functions';
  }

  /**
   * Makes an HTTP request to the specified endpoint with given options.
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token from Supabase
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Plant Analysis APIs
  async analyzePlant(imageData: string, plantInfo: any, userId: string) {
    return this.makeRequest('/api-router/plants/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageData, plantInfo, userId }),
    });
  }

  async getUserDiagnoses(userId: string) {
    return this.makeRequest(`/api-router/plants/analyze?userId=${encodeURIComponent(userId)}`);
  }

  // Plant Diagnosis APIs
  async createDiagnosis(plantData: any) {
    return this.makeRequest('/api-router/plants/diagnose', {
      method: 'POST',
      body: JSON.stringify(plantData),
    });
  }

  async updateDiagnosis(diagnosisId: string, updateData: any) {
    return this.makeRequest('/api-router/plants/diagnose', {
      method: 'PUT',
      body: JSON.stringify({ diagnosisId, ...updateData }),
    });
  }

  async deleteDiagnosis(diagnosisId: string) {
    return this.makeRequest('/api-router/plants/diagnose', {
      method: 'DELETE',
      body: JSON.stringify({ diagnosisId }),
    });
  }

  // Conversations APIs
  async getConversations(userId: string, expertId?: string) {
    const params = new URLSearchParams({ userId });
    if (expertId) params.append('expertId', expertId);
    
    return this.makeRequest(`/api-router/conversations?${params.toString()}`);
  }

  async getConversation(conversationId: string) {
    return this.makeRequest(`/api-router/conversations/${encodeURIComponent(conversationId)}`);
  }

  async createConversation(userId: string, expertId: string, title?: string) {
    return this.makeRequest('/api-router/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId, expertId, title }),
    });
  }

  async updateConversation(conversationId: string, updateData: any) {
    return this.makeRequest('/api-router/conversations', {
      method: 'PUT',
      body: JSON.stringify({ conversationId, ...updateData }),
    });
  }

  async deleteConversation(conversationId: string) {
    return this.makeRequest('/api-router/conversations', {
      method: 'DELETE',
      body: JSON.stringify({ conversationId }),
    });
  }

  // Messages APIs
  async getMessages(conversationId: string) {
    return this.makeRequest(`/api-router/messages?conversationId=${encodeURIComponent(conversationId)}`);
  }

  async getMessage(messageId: string) {
    return this.makeRequest(`/api-router/messages/${encodeURIComponent(messageId)}`);
  }

  async sendMessage(conversationId: string, senderId: string, recipientId: string, text: string, products?: any[]) {
    return this.makeRequest('/api-router/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, senderId, recipientId, text, products }),
    });
  }

  async sendAudioMessage(conversationId: string, senderId: string, recipientId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('senderId', senderId);
    formData.append('recipientId', recipientId);
    formData.append('audio', audioBlob, 'voice-message.webm');
    
    return this.makeRequest('/api-router/messages/audio', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async updateMessage(messageId: string, updateData: any) {
    return this.makeRequest('/api-router/messages', {
      method: 'PUT',
      body: JSON.stringify({ messageId, ...updateData }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.makeRequest('/api-router/messages', {
      method: 'DELETE',
      body: JSON.stringify({ messageId }),
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.makeRequest('/api-router/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ messageId }),
    });
  }

  // Consultations APIs
  async getConsultations(filters: { userId?: string; expertId?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return this.makeRequest(`/api-router/consultations?${params.toString()}`);
  }

  async getConsultation(consultationId: string) {
    return this.makeRequest(`/api-router/consultations/${encodeURIComponent(consultationId)}`);
  }

  async createConsultation(userId: string, plantInfo: any, symptoms: string, imageUrl?: string) {
    return this.makeRequest('/api-router/consultations', {
      method: 'POST',
      body: JSON.stringify({ userId, plantInfo, symptoms, imageUrl }),
    });
  }

  async updateConsultation(consultationId: string, status: string, response?: string) {
    return this.makeRequest('/api-router/consultations', {
      method: 'PUT',
      body: JSON.stringify({ consultationId, status, response }),
    });
  }

  async deleteConsultation(consultationId: string) {
    return this.makeRequest('/api-router/consultations', {
      method: 'DELETE',
      body: JSON.stringify({ consultationId }),
    });
  }

  // Profiles APIs
  async getProfile(userId: string) {
    return this.makeRequest(`/api-router/profiles?userId=${encodeURIComponent(userId)}`);
  }

  async updateProfile(userId: string, profileData: any) {
    return this.makeRequest('/api-router/profiles', {
      method: 'PUT',
      body: JSON.stringify({ userId, profileData }),
    });
  }

  async deleteProfile(userId: string) {
    return this.makeRequest('/api-router/profiles', {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  // Notifications APIs
  async getNotifications(userId: string, unreadOnly = false) {
    const params = new URLSearchParams({ userId });
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return this.makeRequest(`/api-router/notifications?${params.toString()}`);
  }

  async getNotification(notificationId: string) {
    return this.makeRequest(`/api-router/notifications/${encodeURIComponent(notificationId)}`);
  }

  async createNotification(userId: string, title: string, message: string, type?: string, data?: any) {
    return this.makeRequest('/api-router/notifications', {
      method: 'POST',
      body: JSON.stringify({ userId, title, message, type, data }),
    });
  }

  async updateNotification(notificationId: string, updateData: any) {
    return this.makeRequest('/api-router/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationId, ...updateData }),
    });
  }

  async deleteNotification(notificationId: string) {
    return this.makeRequest('/api-router/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ notificationId }),
    });
  }

  async markNotificationAsRead(notificationId: string, read = true) {
    return this.makeRequest('/api-router/notifications/read', {
      method: 'PUT',
      body: JSON.stringify({ notificationId, read }),
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.makeRequest('/api-router/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  }

  // Diagnoses APIs
  async getDiagnoses(userId: string) {
    return this.makeRequest(`/api-router/diagnoses?userId=${encodeURIComponent(userId)}`);
  }

  async getDiagnosis(diagnosisId: string) {
    return this.makeRequest(`/api-router/diagnoses/${encodeURIComponent(diagnosisId)}`);
  }

  async saveDiagnosis(userId: string, plantType: string, plantVariety: string, symptoms: string, imageUrl: string, diagnosisResult: any) {
    return this.makeRequest('/api-router/diagnoses', {
      method: 'POST',
      body: JSON.stringify({ userId, plantType, plantVariety, symptoms, imageUrl, diagnosisResult }),
    });
  }

  async updateDiagnosisStatus(diagnosisId: string, status: string) {
    return this.makeRequest('/api-router/diagnoses/status', {
      method: 'PUT',
      body: JSON.stringify({ diagnosisId, status }),
    });
  }

  async deleteDiagnosisRecord(diagnosisId: string) {
    return this.makeRequest('/api-router/diagnoses', {
      method: 'DELETE',
      body: JSON.stringify({ diagnosisId }),
    });
  }

  // Products APIs (Shop)
  async getProducts(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    return this.makeRequest(`/api-router/products?${params.toString()}`);
  }

  async getProduct(productId: string) {
    return this.makeRequest(`/api-router/products/${encodeURIComponent(productId)}`);
  }

  async createProduct(productData: any) {
    return this.makeRequest('/api-router/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, updateData: any) {
    return this.makeRequest('/api-router/products', {
      method: 'PUT',
      body: JSON.stringify({ productId, ...updateData }),
    });
  }

  async deleteProduct(productId: string) {
    return this.makeRequest('/api-router/products', {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
    });
  }

  // Orders APIs (Stripe)
  async createPayment(items: any[], successUrl: string, cancelUrl: string) {
    return this.makeRequest('/api-router/orders/create-payment', {
      method: 'POST',
      body: JSON.stringify({ items, successUrl, cancelUrl }),
    });
  }

  async verifyPayment(sessionId: string) {
    return this.makeRequest('/api-router/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getUserOrders(userId: string) {
    return this.makeRequest(`/api-router/orders?userId=${encodeURIComponent(userId)}`);
  }

  async getOrder(orderId: string) {
    return this.makeRequest(`/api-router/orders/${encodeURIComponent(orderId)}`);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.makeRequest('/api-router/orders/status', {
      method: 'PUT',
      body: JSON.stringify({ orderId, status }),
    });
  }

  // Library Articles APIs
  async getLibraryArticles(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    return this.makeRequest(`/api-router/library/articles?${params.toString()}`);
  }

  async getLibraryArticle(articleId: string) {
    return this.makeRequest(`/api-router/library/articles/${encodeURIComponent(articleId)}`);
  }

  async createLibraryArticle(articleData: any) {
    return this.makeRequest('/api-router/library/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  }

  async updateLibraryArticle(articleId: string, updateData: any) {
    return this.makeRequest('/api-router/library/articles', {
      method: 'PUT',
      body: JSON.stringify({ articleId, ...updateData }),
    });
  }

  async deleteLibraryArticle(articleId: string) {
    return this.makeRequest('/api-router/library/articles', {
      method: 'DELETE',
      body: JSON.stringify({ articleId }),
    });
  }

  // User Session APIs
  async createUserSession(userId: string, sessionData: any) {
    return this.makeRequest('/api-router/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, ...sessionData }),
    });
  }

  async getUserSessions(userId: string) {
    return this.makeRequest(`/api-router/sessions?userId=${encodeURIComponent(userId)}`);
  }

  async updateUserSession(sessionId: string, updateData: any) {
    return this.makeRequest('/api-router/sessions', {
      method: 'PUT',
      body: JSON.stringify({ sessionId, ...updateData }),
    });
  }

  async deleteUserSession(sessionId: string) {
    return this.makeRequest('/api-router/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Subscription APIs
  async getSubscriptions(userId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    
    return this.makeRequest(`/api-router/subscriptions?${params.toString()}`);
  }

  async createSubscription(subscriptionData: any) {
    return this.makeRequest('/api-router/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async updateSubscription(subscriptionId: string, updateData: any) {
    return this.makeRequest('/api-router/subscriptions', {
      method: 'PUT',
      body: JSON.stringify({ subscriptionId, ...updateData }),
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.makeRequest('/api-router/subscriptions/cancel', {
      method: 'PUT',
      body: JSON.stringify({ subscriptionId }),
    });
  }

  // Avatar Upload API
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest('/api-router/upload-avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  // File Upload APIs
  async uploadFile(file: File, category?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    
    return this.makeRequest('/api-router/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async deleteFile(fileUrl: string) {
    return this.makeRequest('/api-router/upload', {
      method: 'DELETE',
      body: JSON.stringify({ fileUrl }),
    });
  }

  // Health Check API
  async healthCheck() {
    return this.makeRequest('/api-router/health');
  }

  // Search APIs
  async searchAll(query: string, filters?: any) {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    
    return this.makeRequest(`/api-router/search?${params.toString()}`);
  }

  // Analytics APIs
  async trackEvent(eventName: string, eventData: any, userId?: string) {
    return this.makeRequest('/api-router/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventName, eventData, userId }),
    });
  }

  async getAnalytics(userId?: string, dateRange?: { start: string; end: string }) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    return this.makeRequest(`/api-router/analytics?${params.toString()}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;

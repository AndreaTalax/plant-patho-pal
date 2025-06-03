
// Client-side API service for interacting with backend endpoints
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888/.netlify/functions' 
      : '/.netlify/functions';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
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

  // Conversations APIs
  async getConversations(userId: string, expertId?: string) {
    const params = new URLSearchParams({ userId });
    if (expertId) params.append('expertId', expertId);
    
    return this.makeRequest(`/api-router/conversations?${params.toString()}`);
  }

  async createConversation(userId: string, expertId: string, title?: string) {
    return this.makeRequest('/api-router/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId, expertId, title }),
    });
  }

  // Messages APIs
  async getMessages(conversationId: string) {
    return this.makeRequest(`/api-router/messages?conversationId=${encodeURIComponent(conversationId)}`);
  }

  async sendMessage(conversationId: string, senderId: string, recipientId: string, text: string, products?: any[]) {
    return this.makeRequest('/api-router/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, senderId, recipientId, text, products }),
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

  // Notifications APIs
  async getNotifications(userId: string, unreadOnly = false) {
    const params = new URLSearchParams({ userId });
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return this.makeRequest(`/api-router/notifications?${params.toString()}`);
  }

  async createNotification(userId: string, title: string, message: string, type?: string, data?: any) {
    return this.makeRequest('/api-router/notifications', {
      method: 'POST',
      body: JSON.stringify({ userId, title, message, type, data }),
    });
  }

  async markNotificationAsRead(notificationId: string, read = true) {
    return this.makeRequest('/api-router/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationId, read }),
    });
  }

  // Diagnoses APIs
  async getDiagnoses(userId: string) {
    return this.makeRequest(`/api-router/diagnoses?userId=${encodeURIComponent(userId)}`);
  }

  async getDiagnosis(diagnosisId: string) {
    return this.makeRequest(`/api-router/diagnoses?diagnosisId=${encodeURIComponent(diagnosisId)}`);
  }

  async saveDiagnosis(userId: string, plantType: string, plantVariety: string, symptoms: string, imageUrl: string, diagnosisResult: any) {
    return this.makeRequest('/api-router/diagnoses', {
      method: 'POST',
      body: JSON.stringify({ userId, plantType, plantVariety, symptoms, imageUrl, diagnosisResult }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

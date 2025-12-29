import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@/constants/config';
import {
  ParkingSession,
  ParkingStatusResponse,
  Coordinates,
  CreateSessionRequest,
  ConfirmPaymentRequest,
  SavedLocation,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

// Token storage key
const TOKENS_KEY = 'park_it_auth_tokens';

/**
 * Create axios instance with base config
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

/**
 * Request interceptor - add auth token
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
      if (tokensJson) {
        const tokens = JSON.parse(tokensJson);
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle errors & token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
        if (tokensJson) {
          const tokens = JSON.parse(tokensJson);
          
          // Call refresh endpoint
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.tokens;
          await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(newTokens));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - user needs to re-login
        await SecureStore.deleteItemAsync(TOKENS_KEY);
        // The auth store will handle redirect to login
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Parking API service
 */
export const parkingService = {
  /**
   * Get current active session
   */
  getCurrentSession: async (): Promise<ParkingSession | null> => {
    try {
      const response = await api.get<ParkingSession>('/parking/current');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create new parking session
   */
  createSession: async (data: CreateSessionRequest): Promise<ParkingSession> => {
    const response = await api.post<ParkingSession>('/parking/sessions', data);
    return response.data;
  },

  /**
   * End parking session
   */
  endSession: async (sessionId: string): Promise<void> => {
    await api.post(`/parking/sessions/${sessionId}/end`);
  },

  /**
   * Update session location (car moved)
   */
  updateSessionLocation: async (
    sessionId: string,
    coordinates: Coordinates
  ): Promise<ParkingSession> => {
    const response = await api.patch<ParkingSession>(
      `/parking/sessions/${sessionId}/location`,
      { coordinates }
    );
    return response.data;
  },

  /**
   * Confirm payment for session
   */
  confirmPayment: async (
    sessionId: string,
    data: ConfirmPaymentRequest
  ): Promise<ParkingSession> => {
    const response = await api.post<ParkingSession>(
      `/parking/sessions/${sessionId}/payment`,
      data
    );
    return response.data;
  },

  /**
   * Get parking status for coordinates
   */
  getStatusForLocation: async (coordinates: Coordinates): Promise<ParkingStatusResponse> => {
    const response = await api.get<ParkingStatusResponse>('/parking/status', {
      params: {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      },
    });
    return response.data;
  },

  /**
   * Get parking history
   */
  getHistory: async (page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<ParkingSession>> => {
    const response = await api.get<PaginatedResponse<ParkingSession>>('/parking/history', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get saved locations
   */
  getSavedLocations: async (): Promise<SavedLocation[]> => {
    const response = await api.get<SavedLocation[]>('/users/locations');
    return response.data;
  },

  /**
   * Add saved location
   */
  addSavedLocation: async (
    data: Omit<SavedLocation, 'id' | 'userId' | 'createdAt'>
  ): Promise<SavedLocation> => {
    const response = await api.post<SavedLocation>('/users/locations', data);
    return response.data;
  },

  /**
   * Remove saved location
   */
  removeSavedLocation: async (id: string): Promise<void> => {
    await api.delete(`/users/locations/${id}`);
  },
};

/**
 * Notifications API service
 */
export const notificationsService = {
  /**
   * Register push token
   */
  registerPushToken: async (token: string, platform: 'ios' | 'android'): Promise<void> => {
    await api.post('/notifications/token', { token, platform });
  },

  /**
   * Unregister push token
   */
  unregisterPushToken: async (token: string): Promise<void> => {
    await api.delete('/notifications/token', { data: { token } });
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences: {
    enabled: boolean;
    reminderTimes: number[];
  }): Promise<void> => {
    await api.patch('/notifications/preferences', preferences);
  },

  /**
   * Get notification preferences
   */
  getPreferences: async (): Promise<{
    enabled: boolean;
    reminderTimes: number[];
  }> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },
};

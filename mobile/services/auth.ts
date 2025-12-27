import { api } from './api';
import { User, AuthTokens, LoginRequest } from '@/types';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

interface RefreshResponse {
  tokens: AuthTokens;
}

/**
 * Authentication service
 * Handles SSO login, token refresh, and logout
 */
export const authService = {
  /**
   * Login with Apple Sign In
   */
  loginWithApple: async (identityToken: string, nonce?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/apple', {
      idToken: identityToken,
      nonce,
    });
    return response.data;
  },

  /**
   * Login with Google Sign In
   */
  loginWithGoogle: async (accessToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', {
      accessToken,
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshTokens: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Logout - invalidate tokens on server
   */
  logout: async (accessToken: string): Promise<void> => {
    await api.post('/auth/logout', null, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>('/users/me', data);
    return response.data;
  },

  /**
   * Delete account
   */
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
  },
};

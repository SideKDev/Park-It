import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { User, AuthTokens, AuthState } from '@/types';
import { authService } from '@/services/auth';
import { OAUTH_CONFIG } from '@/constants/config';

// Enable web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Secure storage keys
const TOKENS_KEY = 'park_it_auth_tokens';
const USER_KEY = 'park_it_user';

interface AuthStore extends AuthState {
  // Actions
  checkAuth: () => Promise<void>;
  loginWithApple: (identityToken: string, nonce?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  // Check for existing auth on app start
  checkAuth: async () => {
    try {
      set({ isLoading: true });

      // Retrieve stored tokens
      const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (tokensJson && userJson) {
        const tokens: AuthTokens = JSON.parse(tokensJson);
        const user: User = JSON.parse(userJson);

        // Check if token is expired
        if (tokens.expiresAt > Date.now()) {
          set({
            user,
            tokens,
            isAuthenticated: true,
          });
        } else {
          // Try to refresh
          await get().refreshTokens();
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Clear any invalid data
      await SecureStore.deleteItemAsync(TOKENS_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } finally {
      set({ isLoading: false });
    }
  },

  // Apple Sign In
  loginWithApple: async (identityToken: string, nonce?: string) => {
    try {
      set({ isLoading: true });

      const response = await authService.loginWithApple(identityToken, nonce);

      // Store tokens securely
      await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(response.tokens));
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Apple login error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Google Sign In
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true });

      // Create auth request
      const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: OAUTH_CONFIG.GOOGLE.IOS_CLIENT_ID,
        androidClientId: OAUTH_CONFIG.GOOGLE.ANDROID_CLIENT_ID,
        webClientId: OAUTH_CONFIG.GOOGLE.WEB_CLIENT_ID,
        scopes: OAUTH_CONFIG.GOOGLE.SCOPES,
      });

      // This won't work directly in Zustand - need to handle in component
      // For now, we'll use a simpler flow
      const result = await AuthSession.startAsync({
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${OAUTH_CONFIG.GOOGLE.WEB_CLIENT_ID}` +
          `&redirect_uri=${AuthSession.makeRedirectUri()}` +
          `&response_type=token` +
          `&scope=${OAUTH_CONFIG.GOOGLE.SCOPES.join(' ')}`,
      });

      if (result.type === 'success' && result.params?.access_token) {
        const authResponse = await authService.loginWithGoogle(result.params.access_token);

        await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(authResponse.tokens));
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authResponse.user));

        set({
          user: authResponse.user,
          tokens: authResponse.tokens,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Google sign in was cancelled or failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Call backend to invalidate tokens
      const { tokens } = get();
      if (tokens) {
        await authService.logout(tokens.accessToken).catch(() => {
          // Ignore errors - we're logging out anyway
        });
      }

      // Clear stored data
      await SecureStore.deleteItemAsync(TOKENS_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh tokens
  refreshTokens: async () => {
    try {
      const { tokens } = get();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshTokens(tokens.refreshToken);

      await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(response.tokens));

      set({
        tokens: response.tokens,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      // Force logout on refresh failure
      await get().logout();
      throw error;
    }
  },

  // Update user data
  updateUser: (userData: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...userData };
      set({ user: updatedUser });
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  },
}));

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

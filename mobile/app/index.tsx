import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

/**
 * Root index - redirects to appropriate screen based on auth state
 */
export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

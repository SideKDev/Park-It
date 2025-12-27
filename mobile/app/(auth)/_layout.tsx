import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

/**
 * Auth flow layout - login and onboarding screens
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.light },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

/**
 * Main app layout with bottom tab navigation
 */
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="park"
        options={{
          title: 'Park',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size + 8} color={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen
        name="session"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="moved"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

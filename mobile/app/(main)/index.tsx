import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '@/stores/parkingStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ParkingCard } from '@/components/ParkingCard';
import { colors } from '@/constants/colors';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const {
    currentSession,
    isSessionActive,
    currentStatus,
    statusReason,
    isLoading,
    fetchCurrentSession,
  } = useParkingStore();

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const handleRefresh = () => {
    fetchCurrentSession();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{firstName}!</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(main)/settings')}
          >
            <Ionicons name="person-circle" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active Session or Empty State */}
        {isSessionActive && currentSession ? (
          <View style={styles.activeSessionSection}>
            <Text style={styles.sectionTitle}>Current Parking</Text>
            <TouchableOpacity
              onPress={() => router.push('/(main)/session')}
              activeOpacity={0.8}
            >
              <ParkingCard session={currentSession} showActions />
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(main)/moved')}
              >
                <Ionicons name="car" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>I moved my car</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="car" size={48} color={colors.text.muted} />
            </View>
            <Text style={styles.emptyStateTitle}>No Active Parking</Text>
            <Text style={styles.emptyStateText}>
              Tap the button below when you park to get alerts and avoid tickets.
            </Text>
            <TouchableOpacity
              style={styles.parkButton}
              onPress={() => router.push('/(main)/park')}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.parkButtonText}>I'm Parked</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Parking Tips</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color={colors.status.yellow} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Street Cleaning Today</Text>
              <Text style={styles.tipText}>
                Check alternate side parking rules before you park.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Meter Hours</Text>
              <Text style={styles.tipText}>
                Most meters are free after 7pm and on Sundays.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  activeSessionSection: {
    marginBottom: 32,
  },
  quickActions: {
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.background.card,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  parkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  parkButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  
  // Notification preferences (would be persisted in real app)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your parking history and settings will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Call delete account API
                    await logout();
                    router.replace('/(auth)/login');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border.light, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Sound</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.border.light, true: colors.primaryLight }}
                thumbColor={soundEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Alert.alert('Coming Soon', 'Saved locations will be available in a future update.')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="location" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Saved Locations</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Alert.alert('Coming Soon', 'Reminder settings will be available in a future update.')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="alarm" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Reminder Times</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => openLink('https://sidekickstudios.app/privacy')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="shield-checkmark" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text.muted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => openLink('https://sidekickstudios.app/terms')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text.muted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => openLink('mailto:support@sidekickstudios.app')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="mail" size={20} color={colors.text.secondary} />
                <Text style={styles.settingLabel}>Contact Support</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color={colors.status.red} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Park-IT</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCredit}>by Sidekick Studios</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.red,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  appVersion: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 4,
  },
  appCredit: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
});

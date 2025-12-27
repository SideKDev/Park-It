import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);
  const { loginWithApple, loginWithGoogle } = useAuthStore();

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('apple');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await loginWithApple(credential.identityToken, credential.nonce ?? undefined);
        router.replace('/(auth)/onboarding');
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', 'Unable to sign in with Apple. Please try again.');
        console.error('Apple Sign In Error:', error);
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('google');

      await loginWithGoogle();
      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.');
        console.error('Google Sign In Error:', error);
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="car" size={60} color={colors.primary} />
            <View style={styles.maskOverlay}>
              <Ionicons name="eye" size={24} color={colors.primaryDark} />
            </View>
          </View>
          <Text style={styles.title}>Park-IT</Text>
          <Text style={styles.subtitle}>Your parking sidekick</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="notifications"
            text="Get alerts before your meter expires"
          />
          <FeatureItem
            icon="shield-checkmark"
            text="Avoid parking tickets with smart rules"
          />
          <FeatureItem
            icon="time"
            text="Know exactly when to move your car"
          />
        </View>

        {/* Sign In Buttons */}
        <View style={styles.buttonsSection}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={handleAppleLogin}
              disabled={isLoading}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>

      {/* Sidekick Studios Branding */}
      <View style={styles.brandingSection}>
        <Text style={styles.brandingText}>from</Text>
        <Text style={styles.brandingName}>Sidekick Studios</Text>
      </View>
    </SafeAreaView>
  );
}

// Feature item component
function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  maskOverlay: {
    position: 'absolute',
    top: 25,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  buttonsSection: {
    gap: 12,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 10,
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  brandingSection: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  brandingText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  brandingName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});

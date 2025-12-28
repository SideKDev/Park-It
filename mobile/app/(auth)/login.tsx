import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors } from '@/constants/colors';

export default function LoginScreen() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Apple credential:', credential);
      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled');
      } else {
        Alert.alert('Error', 'Apple Sign In failed');
        console.error('Apple Sign In Error:', error);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon');
  };

  const handleSkipLogin = () => {
    // Dev only - skip to main app
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Park-IT</Text>
        <Text style={styles.subtitle}>Your parking sidekick</Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Get alerts before your meter expires</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Avoid parking tickets with smart rules</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Know exactly when to move your car</Text>
          </View>
        </View>
      </View>

      {/* Auth Buttons */}
      <View style={styles.authContainer}>
        <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn}>
          <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Dev Skip Button */}
        {__DEV__ && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipLogin}>
            <Text style={styles.skipButtonText}>Skip (Dev Mode)</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>

        <View style={styles.brandingContainer}>
          <Text style={styles.brandingFrom}>from</Text>
          <Text style={styles.brandingName}>Sidekick Studios</Text>
        </View>
      </View>
    </SafeAreaView>
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
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  authContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
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
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  googleG: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA4335',
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipButtonText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  terms: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandingFrom: {
    fontSize: 12,
    color: colors.text.muted,
  },
  brandingName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

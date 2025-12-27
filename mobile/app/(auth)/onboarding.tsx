import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

type PermissionStep = 'location' | 'notifications' | 'parkmobile' | 'complete';

interface StepConfig {
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  skipText?: string;
}

const STEPS: Record<PermissionStep, StepConfig> = {
  location: {
    title: 'Enable Location',
    description:
      'Park-IT needs your location to identify parking rules and regulations for your current spot. We only access your location when you park.',
    icon: 'location',
    buttonText: 'Enable Location',
    skipText: 'Skip for now',
  },
  notifications: {
    title: 'Stay Notified',
    description:
      "We'll send you alerts before your meter expires or when it's time to move your car. Never get a ticket again!",
    icon: 'notifications',
    buttonText: 'Enable Notifications',
    skipText: 'Skip for now',
  },
  parkmobile: {
    title: 'Link ParkMobile',
    description:
      "For the best experience, make sure your ParkMobile account uses the same login. This helps us track your parking payments.",
    icon: 'card',
    buttonText: 'Open ParkMobile',
    skipText: "I'll do this later",
  },
  complete: {
    title: "You're All Set!",
    description:
      "Park-IT is ready to be your parking sidekick. Let's find you a great spot!",
    icon: 'checkmark-circle',
    buttonText: 'Get Started',
  },
};

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<PermissionStep>('location');
  const [isLoading, setIsLoading] = useState(false);

  const step = STEPS[currentStep];

  const handleNext = async () => {
    setIsLoading(true);

    try {
      switch (currentStep) {
        case 'location':
          const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
          if (locationStatus === 'granted') {
            // Also request background if available
            const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
            console.log('Background location permission:', bgStatus);
          }
          setCurrentStep('notifications');
          break;

        case 'notifications':
          const { status: notifStatus } = await Notifications.requestPermissionsAsync();
          if (notifStatus === 'granted') {
            // Configure notification handler
            Notifications.setNotificationHandler({
              handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
              }),
            });
          }
          setCurrentStep('parkmobile');
          break;

        case 'parkmobile':
          // Try to open ParkMobile app
          const parkmobileUrl = 'parkmobile://';
          const canOpen = await Linking.canOpenURL(parkmobileUrl);
          if (canOpen) {
            await Linking.openURL(parkmobileUrl);
          } else {
            // Open App Store / Play Store
            const storeUrl =
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/parkmobile/id367203638'
                : 'https://play.google.com/store/apps/details?id=com.parkmobile.consumer';
            await Linking.openURL(storeUrl);
          }
          setCurrentStep('complete');
          break;

        case 'complete':
          // Navigate to main app
          router.replace('/(main)');
          break;
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    switch (currentStep) {
      case 'location':
        setCurrentStep('notifications');
        break;
      case 'notifications':
        setCurrentStep('parkmobile');
        break;
      case 'parkmobile':
        setCurrentStep('complete');
        break;
    }
  };

  const getProgressDots = () => {
    const steps: PermissionStep[] = ['location', 'notifications', 'parkmobile', 'complete'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((s, index) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              index <= currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      {getProgressDots()}

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            currentStep === 'complete' && styles.iconContainerSuccess,
          ]}
        >
          <Ionicons
            name={step.icon as any}
            size={64}
            color={currentStep === 'complete' ? colors.status.green : colors.primary}
          />
        </View>

        {/* Text */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Please wait...' : step.buttonText}
          </Text>
        </TouchableOpacity>

        {step.skipText && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{step.skipText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Need Platform import
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainerSuccess: {
    backgroundColor: '#ECFDF5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
});

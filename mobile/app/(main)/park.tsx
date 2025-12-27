import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '@/stores/parkingStore';
import { colors } from '@/constants/colors';
import { Coordinates } from '@/types';

export default function ParkScreen() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const { createSession, isCreatingSession } = useParkingStore();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Please enable location permissions to use Park-IT.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: Coordinates = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get address
      const [geocoded] = await Location.reverseGeocodeAsync(coords);
      if (geocoded) {
        const addressParts = [
          geocoded.streetNumber,
          geocoded.street,
          geocoded.city,
        ].filter(Boolean);
        setAddress(addressParts.join(' ') || 'Unknown location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleConfirmParking = async () => {
    if (!location) {
      Alert.alert('Error', 'Please wait for location to be captured.');
      return;
    }

    try {
      await createSession(location, 'manual');
      router.replace('/(main)/session');
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Unable to start parking session. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Park Here</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            {isGettingLocation ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="location" size={32} color={colors.primary} />
            )}
          </View>

          {isGettingLocation ? (
            <Text style={styles.locationText}>Getting your location...</Text>
          ) : location ? (
            <>
              <Text style={styles.locationAddress}>{address || 'Location captured'}</Text>
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.locationText}>Unable to get location</Text>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.refreshButtonText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              We'll check the parking rules for this location and notify you before any violations.
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!location || isCreatingSession) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmParking}
          disabled={!location || isCreatingSession}
        >
          {isCreatingSession ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm Parking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  locationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

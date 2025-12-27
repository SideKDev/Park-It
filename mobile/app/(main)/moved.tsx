import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '@/stores/parkingStore';
import { colors } from '@/constants/colors';
import { Coordinates } from '@/types';
import { locationService } from '@/services/location';

type LocationMethod = 'current' | 'manual';

export default function MovedScreen() {
  const [selectedMethod, setSelectedMethod] = useState<LocationMethod>('current');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<Coordinates | null>(null);
  const [newAddress, setNewAddress] = useState<string | null>(null);

  const { currentSession, updateSessionLocation, isLoading } = useParkingStore();

  useEffect(() => {
    if (selectedMethod === 'current') {
      getCurrentLocation();
    }
  }, [selectedMethod]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await locationService.getCurrentLocation('high');
      setNewLocation(coords);

      const geocoded = await locationService.reverseGeocode(coords);
      setNewAddress(geocoded.address || 'Unknown location');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!newLocation) {
      Alert.alert('Error', 'Please wait for location to be captured.');
      return;
    }

    // Check if location is the same
    if (currentSession) {
      const isSame = locationService.isSameLocation(
        {
          latitude: currentSession.location.latitude,
          longitude: currentSession.location.longitude,
        },
        newLocation
      );

      if (isSame) {
        Alert.alert(
          'Same Location',
          "You appear to be in the same spot. Are you sure you've moved?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update Anyway', onPress: performUpdate },
          ]
        );
        return;
      }
    }

    performUpdate();
  };

  const performUpdate = async () => {
    if (!newLocation) return;

    try {
      await updateSessionLocation(newLocation);
      Alert.alert(
        'Location Updated',
        "We've updated your parking location and refreshed the rules.",
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)/session'),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Unable to update location. Please try again.');
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
        <Text style={styles.headerTitle}>Update Location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <Text style={styles.instructions}>
          Where did you move your car to?
        </Text>

        {/* Location Methods */}
        <View style={styles.methodsContainer}>
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'current' && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod('current')}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="navigate"
                size={24}
                color={selectedMethod === 'current' ? colors.primary : colors.text.muted}
              />
            </View>
            <Text
              style={[
                styles.methodTitle,
                selectedMethod === 'current' && styles.methodTitleSelected,
              ]}
            >
              Use Current Location
            </Text>
            <Text style={styles.methodDescription}>
              Automatically detect where you are now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'manual' && styles.methodCardSelected,
            ]}
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Manual location entry will be available in a future update.',
                [{ text: 'OK' }]
              );
            }}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="map"
                size={24}
                color={colors.text.muted}
              />
            </View>
            <Text style={styles.methodTitle}>
              Enter Manually
            </Text>
            <Text style={styles.methodDescription}>
              Drop a pin or enter an address
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* New Location Preview */}
        {selectedMethod === 'current' && (
          <View style={styles.locationPreview}>
            <Text style={styles.previewLabel}>New Location</Text>
            <View style={styles.locationCard}>
              {isGettingLocation ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Getting location...</Text>
                </View>
              ) : newLocation ? (
                <View style={styles.locationContent}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationAddress}>
                      {newAddress || 'Location captured'}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {newLocation.latitude.toFixed(6)}, {newLocation.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.errorText}>Unable to get location</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Update Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.updateButton,
              (!newLocation || isLoading) && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdateLocation}
            disabled={!newLocation || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                <Text style={styles.updateButtonText}>Update Location</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  instructions: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  methodTitleSelected: {
    color: colors.primary,
  },
  methodDescription: {
    fontSize: 13,
    color: colors.text.muted,
    lineHeight: 18,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  locationPreview: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  locationCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 13,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: 15,
    color: colors.status.red,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  refreshText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 'auto',
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  updateButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});

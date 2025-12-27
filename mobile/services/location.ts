import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Coordinates } from '@/types';
import { LOCATION_CONFIG } from '@/constants/config';

// Background location task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

/**
 * Location service
 * Handles GPS location capture and background tracking
 */
export const locationService = {
  /**
   * Request foreground location permissions
   */
  requestForegroundPermission: async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Request background location permissions
   */
  requestBackgroundPermission: async (): Promise<boolean> => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Check if location permissions are granted
   */
  checkPermissions: async (): Promise<{
    foreground: boolean;
    background: boolean;
  }> => {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  },

  /**
   * Get current location
   */
  getCurrentLocation: async (
    accuracy: 'high' | 'medium' | 'low' = 'high'
  ): Promise<Coordinates> => {
    const accuracyMap = {
      high: Location.Accuracy.High,
      medium: Location.Accuracy.Balanced,
      low: Location.Accuracy.Low,
    };

    const location = await Location.getCurrentPositionAsync({
      accuracy: accuracyMap[accuracy],
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode: async (
    coordinates: Coordinates
  ): Promise<{
    address: string | null;
    street: string | null;
    city: string | null;
    borough: string | null;
  }> => {
    try {
      const [result] = await Location.reverseGeocodeAsync(coordinates);
      
      if (result) {
        const addressParts = [
          result.streetNumber,
          result.street,
        ].filter(Boolean);

        return {
          address: addressParts.join(' ') || null,
          street: result.street || null,
          city: result.city || null,
          borough: result.district || result.subregion || null,
        };
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }

    return {
      address: null,
      street: null,
      city: null,
      borough: null,
    };
  },

  /**
   * Calculate distance between two points (in meters)
   */
  getDistance: (from: Coordinates, to: Coordinates): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Check if two locations are the same (within threshold)
   */
  isSameLocation: (
    a: Coordinates,
    b: Coordinates,
    threshold: number = LOCATION_CONFIG.SAME_LOCATION_THRESHOLD
  ): boolean => {
    return locationService.getDistance(a, b) < threshold;
  },

  /**
   * Start background location tracking
   */
  startBackgroundTracking: async (
    onLocationChange: (location: Coordinates) => void
  ): Promise<boolean> => {
    const permissions = await locationService.checkPermissions();
    
    if (!permissions.background) {
      console.warn('Background location permission not granted');
      return false;
    }

    // Define the background task
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
      if (error) {
        console.error('Background location error:', error);
        return;
      }

      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
          const latest = locations[locations.length - 1];
          onLocationChange({
            latitude: latest.coords.latitude,
            longitude: latest.coords.longitude,
          });
        }
      }
    });

    // Start tracking
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_CONFIG.BACKGROUND_UPDATE_INTERVAL,
      distanceInterval: LOCATION_CONFIG.BACKGROUND_MIN_DISTANCE,
      foregroundService: {
        notificationTitle: 'Park-IT',
        notificationBody: 'Tracking your parking location',
        notificationColor: '#4A7FC1',
      },
      pausesUpdatesAutomatically: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });

    return true;
  },

  /**
   * Stop background location tracking
   */
  stopBackgroundTracking: async (): Promise<void> => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  },

  /**
   * Check if background tracking is active
   */
  isBackgroundTrackingActive: async (): Promise<boolean> => {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  },
};

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '@/stores/parkingStore';
import { colors } from '@/constants/colors';
import { Coordinates } from '@/types';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280;

interface AddressSuggestion {
  id: string;
  address: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

export default function ParkScreen() {
  const mapRef = useRef<MapView>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { createSession, isCreatingSession } = useParkingStore();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Animate map to new location
  const animateToLocation = (coords: Coordinates) => {
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (coords: Coordinates) => {
    try {
      const [geocoded] = await Location.reverseGeocodeAsync(coords);
      if (geocoded) {
        const addressParts = [
          geocoded.streetNumber,
          geocoded.street,
          geocoded.city,
          geocoded.region,
        ].filter(Boolean);
        return addressParts.join(' ') || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Unknown location';
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newCoords = { latitude, longitude };
    setLocation(newCoords);
    
    const newAddress = await reverseGeocode(newCoords);
    setAddress(newAddress);
  };

  // Handle map press to move pin
  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newCoords = { latitude, longitude };
    setLocation(newCoords);
    
    const newAddress = await reverseGeocode(newCoords);
    setAddress(newAddress);
  };

  // Search addresses with debounce
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchQuery = query.toLowerCase().includes('new york') || 
                         query.toLowerCase().includes('nyc') ||
                         query.toLowerCase().includes('ny')
        ? query 
        : `${query}, New York, NY`;
      
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results.length > 0) {
        const suggestionsPromises = results.slice(0, 5).map(async (result, index) => {
          const [reverseResult] = await Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude,
          });
          
          if (reverseResult) {
            const mainAddress = [
              reverseResult.streetNumber,
              reverseResult.street,
            ].filter(Boolean).join(' ');
            
            const subtitle = [
              reverseResult.city,
              reverseResult.region,
              reverseResult.postalCode,
            ].filter(Boolean).join(', ');
            
            return {
              id: `${index}-${result.latitude}-${result.longitude}`,
              address: mainAddress || query,
              subtitle: subtitle,
              latitude: result.latitude,
              longitude: result.longitude,
            };
          }
          return null;
        });
        
        const resolvedSuggestions = (await Promise.all(suggestionsPromises))
          .filter((s): s is AddressSuggestion => s !== null);
        
        setSuggestions(resolvedSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddressChange = (text: string) => {
    setManualAddress(text);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      searchAddresses(text);
    }, 500);
    
    setDebounceTimer(timer);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const fullAddress = `${suggestion.address}, ${suggestion.subtitle}`;
    setManualAddress(fullAddress);
    const newCoords = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
    setLocation(newCoords);
    setAddress(fullAddress);
    setSuggestions([]);
    setIsManualEntry(false);
    animateToLocation(newCoords);
    Keyboard.dismiss();
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setIsManualEntry(false);
    setSuggestions([]);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Location Required',
            'Please enable location permissions to use Park-IT.',
          );
          return;
        }
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: Coordinates = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
      setLocation(coords);
      animateToLocation(coords);

      const newAddress = await reverseGeocode(coords);
      setAddress(newAddress);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleConfirmParking = async () => {
    if (!location) {
      Alert.alert('Error', 'Please select a location first.');
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

  // Default to NYC if no location
  const mapRegion = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  } : {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
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

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={mapRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {location && (
            <Marker
              coordinate={location}
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Map Controls */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Drag hint */}
        {location && (
          <View style={styles.dragHint}>
            <Ionicons name="hand-left" size={14} color={colors.text.muted} />
            <Text style={styles.dragHintText}>Drag pin or tap map to adjust</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={colors.text.muted} />
          <TextInput
            style={styles.addressInput}
            placeholder="Search address..."
            placeholderTextColor={colors.text.muted}
            value={manualAddress}
            onChangeText={handleAddressChange}
            onFocus={() => setIsManualEntry(true)}
            returnKeyType="search"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {manualAddress.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => {
              setManualAddress('');
              setSuggestions([]);
            }}>
              <Ionicons name="close-circle" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionAddress}>{item.address}</Text>
                  <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Location Info Card */}
      {location && address && (
        <View style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={colors.status.green} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationAddress} numberOfLines={2}>{address}</Text>
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Confirm Button */}
      <View style={styles.bottomContainer}>
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
    backgroundColor: '#FFFFFF',
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
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dragHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  dragHintText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  addressInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background.light,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  locationCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 20,
  },
  locationCoords: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: 'auto',
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

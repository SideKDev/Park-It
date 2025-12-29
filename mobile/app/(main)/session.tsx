import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Clipboard from 'expo-clipboard';
import { useParkingStore } from '@/stores/parkingStore';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, getStatusColor, getStatusBackground } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SessionScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedZone, setCopiedZone] = useState(false);
  
  const {
    currentSession,
    isSessionActive,
    endSession,
    isEndingSession,
    confirmPayment,
  } = useParkingStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSessionActive || !currentSession) {
      router.replace('/(main)');
    }
  }, [isSessionActive, currentSession]);

  if (!currentSession) {
    return null;
  }

  const handleEndSession = () => {
    Alert.alert(
      'End Parking Session',
      'Are you sure you want to end this parking session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            await endSession();
            router.replace('/(main)');
          },
        },
      ]
    );
  };

  const handleMovedCar = () => {
    Alert.alert(
      'Moved Your Car?',
      'This will end your current session. You can start a new one at your new location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, End Session',
          onPress: async () => {
            await endSession();
            router.replace('/(main)/park');
          },
        },
      ]
    );
  };

  const handleCopyZoneCode = async () => {
    const zoneCode = currentSession.location.zoneCode;
    if (zoneCode) {
      await Clipboard.setStringAsync(zoneCode);
      setCopiedZone(true);
      setTimeout(() => setCopiedZone(false), 2000);
    }
  };

  const handlePayWithParkNYC = async () => {
    const zoneCode = currentSession.location.zoneCode;
    
    if (zoneCode) {
      Alert.alert(
        'Opening ParkNYC',
        `Zone: ${zoneCode}\n\nAfter you pay, come back and tap "I Paid" so we can track it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open ParkNYC',
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL('parknyc://');
                if (canOpen) {
                  await Linking.openURL(`parknyc://park?zoneId=${zoneCode}`);
                } else {
                  await Linking.openURL('https://apps.apple.com/app/parknyc/id1592160562');
                }
              } catch (e) {
                await Linking.openURL('https://apps.apple.com/app/parknyc/id1592160562');
              }
            },
          },
        ]
      );
    } else {
      await Linking.openURL('https://apps.apple.com/app/parknyc/id1592160562');
    }
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirm Payment',
      'How long did you pay for?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '30 min', onPress: () => confirmPayment('parknyc', 30) },
        { text: '1 hour', onPress: () => confirmPayment('parknyc', 60) },
        { text: '2 hours', onPress: () => confirmPayment('parknyc', 120) },
      ]
    );
  };

  const statusColor = getStatusColor(currentSession.status);
  const statusBg = getStatusBackground(currentSession.status);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    
    let date: Date;
    if (typeof dateString === 'string') {
      if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        date = new Date(dateString + 'Z');
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const getTimeRemaining = () => {
    if (!currentSession.expiresAt) return null;
    
    let expires: Date;
    const expStr = currentSession.expiresAt;
    if (!expStr.includes('Z') && !expStr.includes('+') && !expStr.includes('-', 10)) {
      expires = new Date(expStr + 'Z');
    } else {
      expires = new Date(expStr);
    }
    
    const diff = expires.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getElapsedTime = () => {
    if (!currentSession.startedAt) return null;
    
    let started: Date;
    const startStr = currentSession.startedAt;
    if (!startStr.includes('Z') && !startStr.includes('+') && !startStr.includes('-', 10)) {
      started = new Date(startStr + 'Z');
    } else {
      started = new Date(startStr);
    }
    
    const diff = currentTime.getTime() - started.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m parked`;
    }
    return `${minutes}m parked`;
  };

  const parkedLocation = {
    latitude: currentSession.location.latitude,
    longitude: currentSession.location.longitude,
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
        <Text style={styles.headerTitle}>Parking Session</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusBg }]}>
          <StatusBadge status={currentSession.status} size="large" />
          <Text style={[styles.statusReason, { color: statusColor }]}>
            {currentSession.statusReason}
          </Text>
          {getTimeRemaining() && (
            <Text style={styles.timeRemaining}>{getTimeRemaining()}</Text>
          )}
        </View>

        {/* Map showing parked location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Car</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                ...parkedLocation,
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={parkedLocation}>
                <View style={styles.markerContainer}>
                  <Ionicons name="car" size={20} color="#FFFFFF" />
                </View>
              </Marker>
            </MapView>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {currentSession.location.address || 
                 `${currentSession.location.latitude.toFixed(4)}, ${currentSession.location.longitude.toFixed(4)}`}
              </Text>
            </View>
            {currentSession.location.zoneCode && (
              <TouchableOpacity style={styles.zoneRow} onPress={handleCopyZoneCode}>
                <View style={styles.infoRow}>
                  <Ionicons name="grid" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    Zone: {currentSession.location.zoneCode}
                  </Text>
                  <View style={styles.copyButton}>
                    <Ionicons 
                      name={copiedZone ? "checkmark" : "copy-outline"} 
                      size={18} 
                      color={copiedZone ? colors.status.green : colors.primary} 
                    />
                    <Text style={[styles.copyText, copiedZone && styles.copiedText]}>
                      {copiedZone ? 'Copied!' : 'Copy'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                Started: {formatTime(currentSession.startedAt)}
              </Text>
            </View>
            {getElapsedTime() && (
              <View style={styles.infoRow}>
                <Ionicons name="hourglass" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{getElapsedTime()}</Text>
              </View>
            )}
            {currentSession.expiresAt && (
              <View style={styles.infoRow}>
                <Ionicons name="alarm" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Expires: {formatTime(currentSession.expiresAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Section (if metered) */}
        {currentSession.parkingType === 'meter' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name={currentSession.paymentStatus === 'paid' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={currentSession.paymentStatus === 'paid' ? colors.status.green : colors.status.yellow}
                />
                <Text style={styles.infoText}>
                  Status: {currentSession.paymentStatus === 'paid' ? 'Paid' : 'Payment needed'}
                </Text>
              </View>
              
              {currentSession.paymentStatus !== 'paid' && (
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={handlePayWithParkNYC}
                  >
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                    <Text style={styles.paymentButtonText}>Pay with ParkNYC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.paidButton}
                    onPress={handleConfirmPayment}
                  >
                    <Text style={styles.paidButtonText}>I Already Paid</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Rules Info */}
        {currentSession.applicableRules && currentSession.applicableRules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parking Rules</Text>
            <View style={styles.infoCard}>
              {currentSession.applicableRules.map((rule, index) => (
                <View key={rule.id || index} style={styles.ruleItem}>
                  <Ionicons name="document-text" size={16} color={colors.text.muted} />
                  <Text style={styles.ruleText}>{rule.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.moveButton}
            onPress={handleMovedCar}
          >
            <Ionicons name="car" size={20} color={colors.primary} />
            <Text style={styles.moveButtonText}>I Moved My Car</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}
            disabled={isEndingSession}
          >
            <Ionicons name="stop-circle" size={20} color={colors.status.red} />
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusReason: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  timeRemaining: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  zoneRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  copiedText: {
    color: colors.status.green,
  },
  paymentActions: {
    marginTop: 12,
    gap: 10,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  paidButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  paidButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionsSection: {
    marginTop: 12,
    gap: 12,
  },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  moveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  endButtonText: {
    color: colors.status.red,
    fontSize: 16,
    fontWeight: '600',
  },
});

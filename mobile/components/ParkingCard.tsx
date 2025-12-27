import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, StatusDot } from './StatusBadge';
import { colors, getStatusColor } from '@/constants/colors';
import { ParkingSession } from '@/types';

interface ParkingCardProps {
  session: ParkingSession;
  showActions?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function ParkingCard({ 
  session, 
  showActions = false, 
  onPress,
  compact = false,
}: ParkingCardProps) {
  const statusColor = getStatusColor(session.status);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRemaining = () => {
    if (!session.expiresAt) return null;
    const now = new Date();
    const expires = new Date(session.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  if (compact) {
    return (
      <CardWrapper 
        style={styles.compactCard} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <StatusDot status={session.status} />
        <View style={styles.compactContent}>
          <Text style={styles.compactAddress} numberOfLines={1}>
            {session.location.address || 'Unknown location'}
          </Text>
          <Text style={styles.compactTime}>
            {formatDate(session.startedAt)} • {formatTime(session.startedAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </CardWrapper>
    );
  }

  return (
    <CardWrapper 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Header */}
      <View style={styles.header}>
        <StatusBadge status={session.status} size="small" />
        {getTimeRemaining() && (
          <Text style={[styles.timeRemaining, { color: statusColor }]}>
            {getTimeRemaining()}
          </Text>
        )}
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons name="location" size={18} color={colors.text.secondary} />
        <Text style={styles.address} numberOfLines={2}>
          {session.location.address || 'Unknown location'}
        </Text>
      </View>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={colors.text.muted} />
          <Text style={styles.detailText}>
            {formatTime(session.startedAt)}
          </Text>
        </View>
        
        {session.location.zoneCode && (
          <View style={styles.detailItem}>
            <Ionicons name="grid-outline" size={14} color={colors.text.muted} />
            <Text style={styles.detailText}>
              Zone {session.location.zoneCode}
            </Text>
          </View>
        )}

        {session.paymentStatus === 'paid' && (
          <View style={styles.detailItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.status.green} />
            <Text style={[styles.detailText, { color: colors.status.green }]}>
              Paid
            </Text>
          </View>
        )}
      </View>

      {/* Status Reason */}
      <View style={styles.reasonContainer}>
        <Text style={styles.reasonText}>{session.statusReason}</Text>
      </View>
    </CardWrapper>
  );
}

// History card variant
export function HistoryCard({ session, onPress }: { session: ParkingSession; onPress?: () => void }) {
  return <ParkingCard session={session} onPress={onPress} compact />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRemaining: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  address: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.text.muted,
  },
  reasonContainer: {
    backgroundColor: colors.background.light,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reasonText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  compactTime: {
    fontSize: 13,
    color: colors.text.muted,
  },
});

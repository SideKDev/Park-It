import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getStatusColor, getStatusBackground, ParkingStatusColor } from '@/constants/colors';

interface StatusBadgeProps {
  status: ParkingStatusColor;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  green: {
    icon: 'checkmark-circle' as const,
    label: 'Good to Park',
  },
  yellow: {
    icon: 'warning' as const,
    label: 'Caution',
  },
  red: {
    icon: 'close-circle' as const,
    label: "Don't Park",
  },
};

export function StatusBadge({ 
  status, 
  size = 'medium', 
  showLabel = true 
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const statusColor = getStatusColor(status);
  const backgroundColor = getStatusBackground(status);

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: 16,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: 24,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: 48,
      text: styles.textLarge,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, { backgroundColor }]}>
      <Ionicons 
        name={config.icon} 
        size={currentSize.icon} 
        color={statusColor} 
      />
      {showLabel && (
        <Text style={[styles.text, currentSize.text, { color: statusColor }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

// Simple dot indicator version
export function StatusDot({ status }: { status: ParkingStatusColor }) {
  const statusColor = getStatusColor(status);
  
  return (
    <View style={[styles.dot, { backgroundColor: statusColor }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  containerSmall: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  containerMedium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  containerLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    flexDirection: 'column',
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

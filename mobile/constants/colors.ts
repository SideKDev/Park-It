/**
 * Park-IT Brand Colors
 * Extracted from Sidekick Studios logo
 */

export const colors = {
  // Primary palette (from logo)
  primary: '#4A7FC1',        // Sidekick Blue - main meter body
  primaryDark: '#2D4A6E',    // Deep Blue - mask color
  primaryLight: '#B8D4F0',   // Light Blue - meter face
  accent: '#E53935',         // Hero Red - cape

  // Status colors
  status: {
    green: '#4CAF50',        // Good to park
    yellow: '#FFC107',       // Caution - action needed
    red: '#E53935',          // Don't park / urgent (matches cape)
  },

  // Backgrounds
  background: {
    light: '#F5F8FC',
    dark: '#0A0A0A',
    card: '#FFFFFF',
    cardDark: '#1A1A2E',
  },

  // Text
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    light: '#FFFFFF',
    dark: '#111827',
  },

  // Borders
  border: {
    light: '#E5E7EB',
    dark: '#374151',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Transparent overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

// Parking status type
export type ParkingStatusColor = 'green' | 'yellow' | 'red';

// Helper to get status color
export const getStatusColor = (status: ParkingStatusColor): string => {
  return colors.status[status];
};

// Helper to get status background (lighter version)
export const getStatusBackground = (status: ParkingStatusColor): string => {
  const backgrounds: Record<ParkingStatusColor, string> = {
    green: '#ECFDF5',
    yellow: '#FFFBEB',
    red: '#FEF2F2',
  };
  return backgrounds[status];
};

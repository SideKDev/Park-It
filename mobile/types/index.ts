/**
 * Park-IT Type Definitions
 */

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: 'apple' | 'google';
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// Parking Types
// ============================================

export type ParkingStatus = 'green' | 'yellow' | 'red';

export type ParkingType = 'meter' | 'street_cleaning' | 'free' | 'no_parking';

export type PaymentStatus = 'unpaid' | 'paid' | 'expired';

export type PaymentMethod = 'parkmobile' | 'paybyphone' | 'coin' | 'other';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingLocation extends Coordinates {
  address: string | null;
  zoneCode: string | null;
  borough: string | null;
  block: string | null;
}

export interface ParkingRule {
  id: string;
  type: ParkingType;
  description: string;
  startTime: string | null;  // HH:mm format
  endTime: string | null;    // HH:mm format
  days: number[];            // 0 = Sunday, 6 = Saturday
  maxDuration: number | null; // minutes
  rate: number | null;       // dollars per hour
}

export interface ParkingSession {
  id: string;
  userId: string;
  location: ParkingLocation;
  status: ParkingStatus;
  statusReason: string;
  parkingType: ParkingType;
  applicableRules: ParkingRule[];
  
  // Timestamps
  startedAt: string;
  endedAt: string | null;
  expiresAt: string | null;  // When current parking permission expires
  
  // Payment info
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidDurationMinutes: number | null;
  paymentExpiresAt: string | null;
  
  // Detection method
  detectionMethod: 'manual' | 'bluetooth' | 'activity_recognition';
  
  createdAt: string;
  updatedAt: string;
}

export interface ParkingStatusResponse {
  status: ParkingStatus;
  statusReason: string;
  parkingType: ParkingType;
  rules: ParkingRule[];
  expiresAt: string | null;
  recommendations: string[];
}

// ============================================
// Saved Locations
// ============================================

export interface SavedLocation {
  id: string;
  userId: string;
  name: string;  // 'home', 'work', or custom
  coordinates: Coordinates;
  address: string | null;
  createdAt: string;
}

// ============================================
// Notifications
// ============================================

export interface NotificationPreferences {
  enabled: boolean;
  reminderTimes: number[];  // minutes before expiry
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Request Types
// ============================================

export interface LoginRequest {
  provider: 'apple' | 'google';
  idToken: string;
  nonce?: string; // Required for Apple
}

export interface CreateSessionRequest {
  coordinates: Coordinates;
  detectionMethod: 'manual' | 'bluetooth' | 'activity_recognition';
}

export interface UpdateSessionRequest {
  coordinates?: Coordinates;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidDurationMinutes?: number;
}

export interface ConfirmPaymentRequest {
  method: PaymentMethod;
  durationMinutes: number;
}

// ============================================
// Store Types
// ============================================

export interface ParkingState {
  // Current session
  currentSession: ParkingSession | null;
  isSessionActive: boolean;
  
  // Status
  currentStatus: ParkingStatus | null;
  statusReason: string | null;
  
  // History
  sessionHistory: ParkingSession[];
  historyLoading: boolean;
  
  // Location
  currentLocation: Coordinates | null;
  savedLocations: SavedLocation[];
  
  // Loading states
  isLoading: boolean;
  isCreatingSession: boolean;
  isEndingSession: boolean;
}

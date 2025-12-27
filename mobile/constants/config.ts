/**
 * App Configuration
 */

// API Configuration
export const API_CONFIG = {
  // Change this to your deployed backend URL
  BASE_URL: __DEV__ 
    ? 'http://localhost:8000/api/v1' 
    : 'https://api.parkit.sidekickstudios.app/api/v1',
  TIMEOUT: 30000, // 30 seconds
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  GOOGLE: {
    // Replace with your Google OAuth client IDs
    IOS_CLIENT_ID: 'your-ios-client-id.apps.googleusercontent.com',
    ANDROID_CLIENT_ID: 'your-android-client-id.apps.googleusercontent.com',
    WEB_CLIENT_ID: 'your-web-client-id.apps.googleusercontent.com',
    SCOPES: [
      'openid',
      'email',
      'profile',
    ],
  },
  APPLE: {
    // Apple Sign-In is configured via app.json
  },
};

// ParkMobile Integration
export const PARKMOBILE_CONFIG = {
  // URL scheme for deep linking
  IOS_URL_SCHEME: 'parkmobile://',
  ANDROID_PACKAGE: 'com.parkmobile.consumer',
  // Fallback web URL
  WEB_URL: 'https://parkmobile.io',
};

// Location Configuration
export const LOCATION_CONFIG = {
  // Minimum accuracy in meters
  ACCURACY: {
    HIGH: 10,
    MEDIUM: 50,
    LOW: 100,
  },
  // Distance threshold to consider "same location" (meters)
  SAME_LOCATION_THRESHOLD: 50,
  // Background location update interval (milliseconds)
  BACKGROUND_UPDATE_INTERVAL: 60000, // 1 minute
  // Minimum distance for background updates (meters)
  BACKGROUND_MIN_DISTANCE: 100,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  // Default reminder times before expiry (minutes)
  DEFAULT_REMINDERS: [60, 30, 15, 5],
  // Channel IDs for Android
  CHANNELS: {
    PARKING_ALERTS: 'parking-alerts',
    REMINDERS: 'reminders',
  },
};

// Parking Detection Configuration
export const PARKING_DETECTION_CONFIG = {
  // Time to wait after stopping before confirming "parked" (milliseconds)
  STATIONARY_CONFIRMATION_DELAY: 120000, // 2 minutes
  // Maximum time between driving and stopping to consider it parking (milliseconds)
  MAX_DRIVING_TO_PARKING_GAP: 300000, // 5 minutes
};

// Feature Flags
export const FEATURES = {
  // Path A (Lean MVP) - Manual first
  MANUAL_PARKING: true,
  PUSH_NOTIFICATIONS: true,
  PARKMOBILE_DEEPLINK: true,
  PARKING_HISTORY: true,
  
  // Path B (Full MVP) - Auto detection
  BLUETOOTH_DETECTION: false,  // Enable in Week 2
  ACTIVITY_RECOGNITION: false, // Enable in Week 2
  BACKGROUND_LOCATION: false,  // Enable in Week 2
  AUTO_SESSION_END: false,     // Enable in Week 2
};

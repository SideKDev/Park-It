export const API_CONFIG = {
  BASE_URL: 'https://unscrutinisingly-untranslated-evie.ngrok-free.dev/api/v1',
  TIMEOUT: 10000,
};

export const OAUTH_CONFIG = {
  GOOGLE: {
    IOS_CLIENT_ID: 'your-ios-client-id.apps.googleusercontent.com',
    ANDROID_CLIENT_ID: 'your-android-client-id.apps.googleusercontent.com',
    WEB_CLIENT_ID: 'your-web-client-id.apps.googleusercontent.com',
    SCOPES: ['openid', 'profile', 'email'],
  },
  APPLE: {
    SERVICE_ID: 'com.sidekickstudios.parkit',
  },
};

export const PARKMOBILE_CONFIG = {
  DEEP_LINK: 'parkmobile://',
  APP_STORE_URL: 'https://apps.apple.com/app/parkmobile/id355249816',
};

export const LOCATION_CONFIG = {
  HIGH_ACCURACY: true,
  DISTANCE_FILTER: 10,
  SAME_LOCATION_THRESHOLD: 50,
  BACKGROUND_UPDATE_INTERVAL: 60000,
  BACKGROUND_MIN_DISTANCE: 100,
};

export const NOTIFICATION_CONFIG = {
  DEFAULT_REMINDERS: [60, 30, 15, 5],
  CHANNELS: {
    PARKING_ALERTS: 'parking-alerts',
    REMINDERS: 'reminders',
  },
};

export const PARKING_DETECTION_CONFIG = {
  STATIONARY_THRESHOLD: 120000,
  BLUETOOTH_DISCONNECT_DELAY: 30000,
};

export const FEATURES = {
  AUTO_DETECTION: true,
  BLUETOOTH_DETECTION: true,
  ACTIVITY_RECOGNITION: true,
  PARKMOBILE_INTEGRATION: true,
};

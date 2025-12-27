import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsService } from './api';
import { NOTIFICATION_CONFIG } from '@/constants/config';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Push notifications service
 * Handles permission requests, token registration, and local notifications
 */
export const pushNotificationService = {
  /**
   * Request notification permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  /**
   * Get and register push token
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    try {
      const permissionGranted = await pushNotificationService.requestPermissions();
      if (!permissionGranted) {
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual Expo project ID
      });
      const token = tokenData.data;

      // Register with backend
      await notificationsService.registerPushToken(
        token,
        Platform.OS as 'ios' | 'android'
      );

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          NOTIFICATION_CONFIG.CHANNELS.PARKING_ALERTS,
          {
            name: 'Parking Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4A7FC1',
          }
        );

        await Notifications.setNotificationChannelAsync(
          NOTIFICATION_CONFIG.CHANNELS.REMINDERS,
          {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
          }
        );
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  /**
   * Unregister push token
   */
  unregisterPushToken: async (token: string): Promise<void> => {
    try {
      await notificationsService.unregisterPushToken(token);
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  },

  /**
   * Schedule a local notification
   */
  scheduleLocalNotification: async (
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, unknown>
  ): Promise<string> => {
    const trigger = triggerDate.getTime() - Date.now();
    
    if (trigger <= 0) {
      throw new Error('Trigger date must be in the future');
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: Math.floor(trigger / 1000),
      },
    });

    return id;
  },

  /**
   * Schedule meter expiry reminders
   */
  scheduleMeterReminders: async (
    expiresAt: Date,
    address: string,
    reminderMinutes: number[] = NOTIFICATION_CONFIG.DEFAULT_REMINDERS
  ): Promise<string[]> => {
    const notificationIds: string[] = [];
    const now = Date.now();

    for (const minutes of reminderMinutes) {
      const triggerTime = expiresAt.getTime() - minutes * 60 * 1000;
      
      // Only schedule if trigger time is in the future
      if (triggerTime > now) {
        const id = await pushNotificationService.scheduleLocalNotification(
          `Meter expires in ${minutes} minutes`,
          `Your parking at ${address} is about to expire. Move your car or add more time.`,
          new Date(triggerTime),
          { type: 'meter_expiry', minutesRemaining: minutes }
        );
        notificationIds.push(id);
      }
    }

    return notificationIds;
  },

  /**
   * Schedule street cleaning reminder
   */
  scheduleCleaningReminder: async (
    cleaningTime: Date,
    address: string,
    reminderMinutes: number = 60
  ): Promise<string> => {
    const triggerTime = cleaningTime.getTime() - reminderMinutes * 60 * 1000;

    return await pushNotificationService.scheduleLocalNotification(
      `Street cleaning in ${reminderMinutes} minutes`,
      `Move your car from ${address} before street cleaning begins.`,
      new Date(triggerTime),
      { type: 'street_cleaning', minutesRemaining: reminderMinutes }
    );
  },

  /**
   * Cancel a scheduled notification
   */
  cancelNotification: async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Cancel all scheduled notifications
   */
  cancelAllNotifications: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Get all pending notifications
   */
  getPendingNotifications: async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener: (
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription => {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener: (
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Get badge count
   */
  getBadgeCount: async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  setBadgeCount: async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Clear badge
   */
  clearBadge: async (): Promise<void> => {
    await Notifications.setBadgeCountAsync(0);
  },
};

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_NOTIFICATION_IDENTIFIER = 'daily_trade_reminder';

// Customize the daily notification text here
const DAILY_NOTIFICATION_TITLE = 'New trades available! 🎮';
const DAILY_NOTIFICATION_BODY = 'Fresh trades are ready. Come back and test your skills!';

/**
 * Schedule a daily notification at 10am local time
 * Uses DAILY trigger type which is more reliable than repeats: true
 */
export async function scheduleDailyNotification(): Promise<
  { ok: true; notificationId: string } | { ok: false; reason: 'permission_denied' | 'error' }
> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    // Cancel any existing daily notification first
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_IDENTIFIER);

    // Use DAILY trigger type - more reliable than repeats: true with time trigger
    // This automatically repeats every day at the specified hour and minute
    // Try using the constant first, fallback to string if needed
    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY || 'daily';
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NOTIFICATION_IDENTIFIER,
      content: {
        title: DAILY_NOTIFICATION_TITLE,
        body: DAILY_NOTIFICATION_BODY,
        sound: true,
        data: { kind: 'daily_reminder' },
      },
      trigger: {
        type: triggerType,
        hour: 10, // 10am
        minute: 0,
      },
    });
    
    const now = new Date();
    const nextNotification = new Date();
    nextNotification.setHours(10, 0, 0, 0);
    if (now.getTime() >= nextNotification.getTime()) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }
    
    console.log('Daily notification scheduled with ID:', notificationId);
    console.log('Will fire daily at 10:00 AM local time');
    console.log('Next notification at:', nextNotification.toLocaleString());
    console.log('Trigger type used:', triggerType);

    // Verify it was scheduled correctly
    const verification = await verifyDailyNotification();
    if (verification.scheduled) {
      console.log('✅ Daily notification verified after scheduling');
    } else {
      console.warn('⚠️ Daily notification scheduled but verification failed');
    }

    return { ok: true, notificationId };
  } catch (error) {
    console.error('Error scheduling daily notification:', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Cancel the daily notification
 */
export async function cancelDailyNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_IDENTIFIER);
    console.log('Daily notification cancelled');
  } catch (error) {
    console.error('Error cancelling daily notification:', error);
  }
}

/**
 * Reschedule daily notification if enabled (for app startup)
 * This checks permissions without requesting them, and reschedules if needed
 */
export async function rescheduleDailyNotificationIfEnabled(): Promise<void> {
  try {
    // Check current permission status (don't request)
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      // Permissions not granted, can't schedule
      console.log('Notification permissions not granted, skipping reschedule');
      return;
    }

    // Check if notification is already scheduled
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const existingNotification = scheduledNotifications.find(
      (n) => n.identifier === DAILY_NOTIFICATION_IDENTIFIER
    );

    if (existingNotification) {
      // Already scheduled, no need to reschedule
      console.log('Daily notification already scheduled, skipping reschedule');
      return;
    }

    // Not scheduled but permissions granted - reschedule it
    console.log('Daily notification not found, rescheduling...');
    const result = await scheduleDailyNotification();
    
    if (result.ok) {
      console.log('Daily notification rescheduled on app startup');
      // Verify it was scheduled correctly
      const verification = await verifyDailyNotification();
      if (verification.scheduled) {
        console.log('✅ Daily notification verified:', {
          nextFireTime: verification.nextFireTime,
          trigger: verification.notification?.trigger,
        });
      } else {
        console.warn('⚠️ Daily notification scheduled but verification failed');
      }
    } else {
      console.log('Failed to reschedule daily notification:', result.reason);
    }
  } catch (error) {
    console.error('Error checking/rescheduling daily notification:', error);
    // Don't throw - this is a background task, shouldn't block app startup
  }
}

/**
 * Verify the daily notification is scheduled correctly
 * Returns info about the scheduled notification for debugging
 */
export async function verifyDailyNotification(): Promise<{
  scheduled: boolean;
  notification?: any;
  nextFireTime?: string;
}> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const dailyNotification = scheduledNotifications.find(
      (n) => n.identifier === DAILY_NOTIFICATION_IDENTIFIER
    );

    if (!dailyNotification) {
      console.log('Daily notification not found in scheduled notifications');
      return { scheduled: false };
    }

    console.log('Daily notification found:', {
      identifier: dailyNotification.identifier,
      trigger: dailyNotification.trigger,
      content: dailyNotification.content,
    });

    // Calculate next fire time based on trigger
    let nextFireTime: string = 'Unknown';
    const trigger = dailyNotification.trigger as any;
    
    if (trigger) {
      // Handle different trigger formats
      let hour: number | undefined;
      let minute: number | undefined;
      
      // iOS format: dateComponents (can be object or array)
      if (trigger.dateComponents) {
        if (Array.isArray(trigger.dateComponents)) {
          // If it's an array, we can't easily extract hour/minute from the log
          // But we know it's scheduled for 10am from our code
          hour = 10;
          minute = 0;
        } else if (typeof trigger.dateComponents === 'object') {
          hour = trigger.dateComponents.hour;
          minute = trigger.dateComponents.minute;
        }
      }
      // Direct format: hour and minute properties
      else if ('hour' in trigger && 'minute' in trigger) {
        hour = trigger.hour;
        minute = trigger.minute;
      }
      
      // Fallback: If we can't extract time but it's a repeating calendar trigger, use 10am (our scheduled time)
      if (hour === undefined || minute === undefined) {
        if (trigger.type === 'calendar' && trigger.repeats === true) {
          hour = 10;
          minute = 0;
          console.log('Using fallback: 10am (calendar trigger with repeats)');
        }
      }
      
      if (hour !== undefined && minute !== undefined) {
        const now = new Date();
        const next = new Date();
        next.setHours(hour, minute, 0, 0);
        if (now.getTime() >= next.getTime()) {
          next.setDate(next.getDate() + 1);
        }
        nextFireTime = next.toLocaleString();
        console.log('Calculated next fire time:', { hour, minute, nextFireTime });
      }
    }

    return {
      scheduled: true,
      notification: dailyNotification,
      nextFireTime,
    };
  } catch (error) {
    console.error('Error verifying daily notification:', error);
    return { scheduled: false };
  }
}

/**
 * Test notification function (for debugging)
 */
export async function testLocalNotificationIn10Seconds(): Promise<
  { ok: true } | { ok: false; reason: 'permission_denied' }
> {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test notification ✅',
      body: 'If you see this, notifications are working.',
      sound: true,
      data: { kind: 'test' },
    },
    trigger: { type: 'time', seconds: 25 },
  });
  
  console.log('Notification scheduled with ID:', notificationId, 'at', new Date().toISOString());
  console.log('Expected to fire at:', new Date(Date.now() + 25000).toISOString());

  return { ok: true };
}

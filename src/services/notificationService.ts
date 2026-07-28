import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Notification permission not granted');
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
}

export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDateISO: string
): Promise<string | undefined> {
  const dueTime = new Date(dueDateISO).getTime();
  const now = Date.now();
  const reminderTime = dueTime - 30 * 60 * 1000;

  if (reminderTime <= now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `"${taskTitle}" is due soon.`,
        data: { taskId },
      },
      trigger: {
        type: 'timeInterval',
        seconds: 10,
      } as any,
    });
    return id;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: `"${taskTitle}" is due in 30 minutes.`,
      data: { taskId },
    },
    trigger: {
      type: 'date',
      date: new Date(reminderTime),
    } as any,
  });
  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleDemoNotification(taskId: string, taskTitle: string): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Demo Reminder',
      body: `"${taskTitle}" demo notification.`,
      data: { taskId },
    },
    trigger: {
      type: 'timeInterval',
      seconds: 30,
    } as any,
  });
  return id;
}
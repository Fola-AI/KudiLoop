import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo();

interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send push notifications to multiple tokens
 */
export async function sendPushNotifications(
  notifications: PushNotification[]
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const messages: ExpoPushMessage[] = [];
  const errors: string[] = [];

  // Build messages array
  for (const notification of notifications) {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(notification.token)) {
      errors.push(`Invalid Expo push token: ${notification.token}`);
      continue;
    }

    messages.push({
      to: notification.token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    });
  }

  if (messages.length === 0) {
    return { success: 0, failed: notifications.length, errors };
  }

  // Chunk messages (Expo recommends batches of ~100)
  const chunks = expo.chunkPushNotifications(messages);
  let successCount = 0;
  let failedCount = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

      for (const ticket of ticketChunk) {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          failedCount++;
          if (ticket.status === "error") {
            errors.push(ticket.message || "Unknown error");
          }
        }
      }
    } catch (error: any) {
      failedCount += chunk.length;
      errors.push(error.message || "Failed to send chunk");
    }
  }

  return { success: successCount, failed: failedCount, errors };
}

/**
 * Send a single push notification
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  const result = await sendPushNotifications([{ token, title, body, data }]);
  return result.success > 0;
}


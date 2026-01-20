import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import { getFirebaseMessaging } from '../config/firebase';

/**
 * Push Notification Service using Firebase Cloud Messaging
 */
export class PushNotificationService {
  private static toFcmData(data?: Record<string, any>): Record<string, string> | undefined {
    if (!data) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null) continue;
      out[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    return Object.keys(out).length ? out : undefined;
  }

  /**
   * Send push notification to a single device
   */
  static async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const messaging = getFirebaseMessaging();
      const message = {
        token,
        notification: { title, body },
        data: this.toFcmData(data),
      };

      const messageId = await messaging.send(message as any);
      logger.info(`Push notification sent: ${messageId}`);
    } catch (error: any) {
      logger.error(`Push notification error: ${error.message}`);
      throw new AppError('Failed to send push notification', 500);
    }
  }

  /**
   * Send push notification to multiple devices
   */
  static async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (!tokens.length) return;

      const messaging = getFirebaseMessaging();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: this.toFcmData(data),
      } as any);

      const failures = response.responses.filter((r) => !r.success).length;
      logger.info(`Push multicast complete. success=${response.successCount} failure=${failures}`);
    } catch (error: any) {
      logger.error(`Batch push notification error: ${error.message}`);
      throw new AppError('Failed to send push notifications', 500);
    }
  }

  /**
   * Send push notification to topic
   */
  static async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const messaging = getFirebaseMessaging();
      const messageId = await messaging.send({
        topic,
        notification: { title, body },
        data: this.toFcmData(data),
      } as any);

      logger.info(`Push topic notification sent: ${messageId}`);
    } catch (error: any) {
      logger.error(`Topic push notification error: ${error.message}`);
      throw new AppError('Failed to send topic push notification', 500);
    }
  }

  /**
   * Subscribe device to topic
   */
  static async subscribeToTopic(token: string, topic: string): Promise<void> {
    try {
      const messaging = getFirebaseMessaging();
      await messaging.subscribeToTopic([token], topic);
      logger.info(`Device subscribed to topic: ${topic}`);
    } catch (error: any) {
      logger.error(`Topic subscription error: ${error.message}`);
      throw new AppError('Failed to subscribe to topic', 500);
    }
  }

  /**
   * Notification templates for ride events
   */
  static async notifyRideAccepted(token: string, driverName: string): Promise<void> {
    await this.sendToDevice(
      token,
      'Ride Accepted! 🚗',
      `${driverName} is on the way to pick you up`,
      { type: 'ride_accepted' }
    );
  }

  static async notifyDriverArrived(token: string): Promise<void> {
    await this.sendToDevice(
      token,
      'Driver Arrived! 📍',
      'Your driver has arrived at the pickup location',
      { type: 'driver_arrived' }
    );
  }

  static async notifyRideStarted(token: string): Promise<void> {
    await this.sendToDevice(
      token,
      'Ride Started! 🚀',
      'Your ride has started. Have a safe journey!',
      { type: 'ride_started' }
    );
  }

  static async notifyRideCompleted(token: string, fare: number): Promise<void> {
    await this.sendToDevice(
      token,
      'Ride Completed! ✅',
      `Thank you for riding with Pikkar. Fare: ₹${fare / 100}`,
      { type: 'ride_completed' }
    );
  }

  static async notifyNewRideRequest(token: string, pickup: string): Promise<void> {
    await this.sendToDevice(
      token,
      'New Ride Request! 🔔',
      `New ride request from ${pickup}`,
      { type: 'new_ride_request' }
    );
  }

  static async notifyPromoCode(token: string, code: string, discount: number): Promise<void> {
    await this.sendToDevice(
      token,
      'Special Offer! 🎁',
      `Use code ${code} for ${discount}% off`,
      { type: 'promo_code' }
    );
  }
}


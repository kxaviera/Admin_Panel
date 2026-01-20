import { SMSService } from './sms.service';
import { EmailService } from './email.service';
import logger from '../utils/logger';

export class NotificationService {
  /**
   * Send multi-channel notification
   */
  static async sendNotification(
    channels: {
      sms?: { phone: string; message: string };
      email?: { email: string; subject: string; html: string };
      push?: { userId: string; title: string; body: string };
    }
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (channels.sms) {
      promises.push(
        SMSService.sendSMS(channels.sms.phone, channels.sms.message).catch(
          (error) => {
            logger.error(`SMS notification failed: ${error.message}`);
          }
        )
      );
    }

    if (channels.email) {
      promises.push(
        EmailService.sendEmail(
          channels.email.email,
          channels.email.subject,
          channels.email.html
        ).catch((error) => {
          logger.error(`Email notification failed: ${error.message}`);
        })
      );
    }

    // Push notifications will be added in future
    if (channels.push) {
      logger.info(`Push notification queued for user ${channels.push.userId}`);
      // TODO: Implement Firebase Cloud Messaging
    }

    await Promise.allSettled(promises);
  }

  /**
   * Notify user about ride status
   */
  static async notifyRideStatus(
    userPhone: string,
    userEmail: string,
    status: string,
    details: any
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      accepted: `Your ride has been accepted! Driver: ${details.driverName}`,
      arrived: `Your driver ${details.driverName} has arrived!`,
      started: 'Your ride has started. Have a safe journey!',
      completed: `Ride completed. Total fare: ₹${details.fare/100}`,
      cancelled: `Your ride has been cancelled. ${details.reason || ''}`,
    };

    const message = statusMessages[status] || 'Ride status updated';

    await this.sendNotification({
      sms: { phone: userPhone, message },
      email: {
        email: userEmail,
        subject: `Ride ${status}`,
        html: `<p>${message}</p>`,
      },
    });
  }

  /**
   * Notify driver about new ride request
   */
  static async notifyDriverNewRide(
    driverPhone: string,
    driverEmail: string,
    rideDetails: any
  ): Promise<void> {
    await this.sendNotification({
      sms: {
        phone: driverPhone,
        message: `New ride request! Pickup: ${rideDetails.pickupAddress}`,
      },
      email: {
        email: driverEmail,
        subject: 'New Ride Request',
        html: `<p>You have a new ride request nearby!</p>`,
      },
    });
  }

  /**
   * Send referral notification
   */
  static async sendReferralNotification(
    phone: string,
    email: string,
    referralCode: string
  ): Promise<void> {
    await this.sendNotification({
      sms: {
        phone,
        message: `Share your referral code ${referralCode} and get rewards!`,
      },
      email: {
        email,
        subject: 'Share Pikkar & Earn Rewards!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Invite Friends & Earn!</h2>
            <p>Share your unique referral code with friends:</p>
            <h1 style="text-align: center; color: #4CAF50; letter-spacing: 5px;">${referralCode}</h1>
            <p>When they sign up, you both get rewards!</p>
          </div>
        `,
      },
    });
  }
}


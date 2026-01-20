import twilio from 'twilio';
import { config } from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

const client = config.twilio.accountSid && config.twilio.authToken
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

export class SMSService {
  /**
   * Send SMS
   */
  static async sendSMS(to: string, message: string): Promise<void> {
    if (!client) {
      logger.warn('Twilio not configured, skipping SMS');
      return;
    }

    try {
      const result = await client.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: to.startsWith('+')
          ? to
          : to.length === 10
            ? `+91${to}` // common default (India local number)
            : `+${to}`, // if caller provides country code digits (e.g. 91XXXXXXXXXX)
      });

      logger.info(`SMS sent to ${to}: ${result.sid}`);
    } catch (error: any) {
      logger.error(`SMS error: ${error.message}`);
      throw new AppError('Failed to send SMS', 500);
    }
  }

  /**
   * Send OTP
   */
  static async sendOTP(phone: string, otp: string): Promise<void> {
    const message = `Your Pikkar verification code is: ${otp}. Valid for 10 minutes.`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send ride confirmation
   */
  static async sendRideConfirmation(
    phone: string,
    rideDetails: {
      driverName: string;
      vehicleNumber: string;
      otp: string;
    }
  ): Promise<void> {
    const message = `Your Pikkar ride is confirmed! Driver: ${rideDetails.driverName}, Vehicle: ${rideDetails.vehicleNumber}, OTP: ${rideDetails.otp}`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send ride completion notification
   */
  static async sendRideCompletion(
    phone: string,
    fare: number
  ): Promise<void> {
    const message = `Your ride is complete! Total fare: ₹${fare/100}. Thank you for using Pikkar!`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send driver arrival notification
   */
  static async sendDriverArrival(
    phone: string,
    driverName: string
  ): Promise<void> {
    const message = `Your driver ${driverName} has arrived at the pickup location.`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send ride cancellation notification
   */
  static async sendRideCancellation(
    phone: string,
    reason: string
  ): Promise<void> {
    const message = `Your Pikkar ride has been cancelled. Reason: ${reason}`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send new ride request to driver
   */
  static async sendNewRideAlert(
    phone: string,
    pickupLocation: string
  ): Promise<void> {
    const message = `New ride request nearby! Pickup: ${pickupLocation}. Open the app to accept.`;
    await this.sendSMS(phone, message);
  }

  /**
   * Send promo code
   */
  static async sendPromoCode(
    phone: string,
    code: string,
    discount: number
  ): Promise<void> {
    const message = `Use promo code ${code} to get ${discount}% off on your next Pikkar ride!`;
    await this.sendSMS(phone, message);
  }
}


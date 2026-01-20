import nodemailer from 'nodemailer';
import { config } from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

const transporter = config.smtp.host && config.smtp.user
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  : null;

export class EmailService {
  /**
   * Send email
   */
  static async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    if (!transporter) {
      logger.warn('Email not configured, skipping email');
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"Pikkar" <${config.smtp.user}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
    } catch (error: any) {
      logger.error(`Email error: ${error.message}`);
      throw new AppError('Failed to send email', 500);
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    email: string,
    name: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Welcome to Pikkar! 🚗</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Pikkar! We're excited to have you on board.</p>
        <p>With Pikkar, you can:</p>
        <ul>
          <li>Book rides quickly and easily</li>
          <li>Track your driver in real-time</li>
          <li>Pay securely with multiple options</li>
          <li>Rate your experience</li>
        </ul>
        <p>Get started by opening the app and booking your first ride!</p>
        <p>Safe travels,<br>The Pikkar Team</p>
      </div>
    `;

    await this.sendEmail(email, 'Welcome to Pikkar!', html);
  }

  /**
   * Send OTP email
   */
  static async sendOTPEmail(
    email: string,
    otp: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Email Verification</h2>
        <p>Your Pikkar verification code is:</p>
        <h1 style="color: #333; background: #f5f5f5; padding: 20px; text-align: center; letter-spacing: 5px;">
          ${otp}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail(email, 'Your Pikkar Verification Code', html);
  }

  /**
   * Send ride receipt
   */
  static async sendRideReceipt(
    email: string,
    rideDetails: {
      rideId: string;
      date: string;
      pickup: string;
      dropoff: string;
      distance: number;
      fare: number;
      paymentMethod: string;
    }
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Ride Receipt</h2>
        <p>Thank you for riding with Pikkar!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Ride ID:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.rideId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Pickup:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.pickup}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Dropoff:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.dropoff}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Distance:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.distance} km</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Payment:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${rideDetails.paymentMethod}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 15px; font-size: 18px;"><strong>Total Fare:</strong></td>
            <td style="padding: 15px; font-size: 18px; color: #4CAF50;"><strong>₹${rideDetails.fare/100}</strong></td>
          </tr>
        </table>
        <p>We hope you had a great experience!</p>
        <p>Best regards,<br>The Pikkar Team</p>
      </div>
    `;

    await this.sendEmail(email, 'Your Pikkar Ride Receipt', html);
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail(email, 'Reset Your Pikkar Password', html);
  }

  /**
   * Send driver approval email
   */
  static async sendDriverApproval(
    email: string,
    driverName: string,
    approved: boolean
  ): Promise<void> {
    const html = approved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Congratulations! 🎉</h2>
          <p>Hi ${driverName},</p>
          <p>Your driver application has been approved! You can now start accepting rides on Pikkar.</p>
          <p>Next steps:</p>
          <ol>
            <li>Complete your profile</li>
            <li>Upload your documents</li>
            <li>Go online and start earning</li>
          </ol>
          <p>Welcome to the Pikkar driver community!</p>
          <p>Best regards,<br>The Pikkar Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Driver Application Update</h2>
          <p>Hi ${driverName},</p>
          <p>Thank you for applying to be a Pikkar driver. Unfortunately, we cannot approve your application at this time.</p>
          <p>This could be due to incomplete documents or other verification issues.</p>
          <p>Please contact support for more information.</p>
          <p>Best regards,<br>The Pikkar Team</p>
        </div>
      `;

    const subject = approved
      ? 'Your Pikkar Driver Application is Approved!'
      : 'Pikkar Driver Application Update';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send promotional email
   */
  static async sendPromoEmail(
    email: string,
    promoCode: string,
    discount: number
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Special Offer Just for You! 🎁</h1>
        <p>We've got an exclusive offer for you!</p>
        <div style="background: #f5f5f5; padding: 30px; text-align: center; margin: 20px 0; border-radius: 10px;">
          <h2 style="margin: 0;">Use Code:</h2>
          <h1 style="color: #4CAF50; letter-spacing: 3px; margin: 10px 0;">${promoCode}</h1>
          <p style="font-size: 20px; margin: 0;">Get ${discount}% OFF</p>
        </div>
        <p style="text-align: center;">Valid for your next ride!</p>
        <p>Happy riding!<br>The Pikkar Team</p>
      </div>
    `;

    await this.sendEmail(email, `${discount}% OFF Your Next Ride!`, html);
  }
}


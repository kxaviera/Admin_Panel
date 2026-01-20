import Stripe from 'stripe';
import { config } from '../config/env';
import Payment from '../models/Payment.model';
import Ride from '../models/Ride.model';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2023-10-16',
});

export class StripeService {
  /**
   * Create a payment intent for a ride
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'inr',
    metadata: any
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in smallest currency unit (paise/cents)
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error: any) {
      logger.error(`Stripe payment intent error: ${error.message}`);
      throw new AppError('Failed to create payment intent', 500);
    }
  }

  /**
   * Create a customer in Stripe
   */
  static async createCustomer(
    email: string,
    name: string,
    metadata: any = {}
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error: any) {
      logger.error(`Stripe customer creation error: ${error.message}`);
      throw new AppError('Failed to create customer', 500);
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error(`Payment confirmation error: ${error.message}`);
      throw new AppError('Payment confirmation failed', 500);
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as any,
      });

      logger.info(`Refund created: ${refund.id}`);
      return refund;
    } catch (error: any) {
      logger.error(`Refund error: ${error.message}`);
      throw new AppError('Refund failed', 500);
    }
  }

  /**
   * Create a payout for driver
   */
  static async createPayout(
    amount: number,
    destination: string,
    metadata: any = {}
  ): Promise<Stripe.Transfer> {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount),
        currency: 'inr',
        destination,
        metadata,
      });

      logger.info(`Payout created: ${transfer.id}`);
      return transfer;
    } catch (error: any) {
      logger.error(`Payout error: ${error.message}`);
      throw new AppError('Payout failed', 500);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret || ''
      );

      logger.info(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      logger.error(`Webhook error: ${error.message}`);
      throw new AppError('Webhook processing failed', 400);
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const rideId = paymentIntent.metadata.rideId;

      if (!rideId) {
        logger.warn('No rideId in payment intent metadata');
        return;
      }

      // Update payment status
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'completed',
          transactionId: paymentIntent.id,
          metadata: {
            cardLast4: (paymentIntent as any).charges?.data?.[0]?.payment_method_details?.card?.last4,
            cardBrand: (paymentIntent as any).charges?.data?.[0]?.payment_method_details?.card?.brand,
          },
        }
      );

      // Update ride payment status
      await Ride.findByIdAndUpdate(rideId, {
        paymentStatus: 'completed',
      });

      logger.info(`Payment successful for ride: ${rideId}`);
    } catch (error: any) {
      logger.error(`Error handling payment success: ${error.message}`);
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const rideId = paymentIntent.metadata.rideId;

      if (!rideId) return;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message,
        }
      );

      await Ride.findByIdAndUpdate(rideId, {
        paymentStatus: 'failed',
      });

      logger.info(`Payment failed for ride: ${rideId}`);
    } catch (error: any) {
      logger.error(`Error handling payment failure: ${error.message}`);
    }
  }

  /**
   * Handle refund
   */
  private static async handleRefund(charge: Stripe.Charge): Promise<void> {
    try {
      const paymentIntentId = charge.payment_intent as string;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          status: 'refunded',
          refundId: charge.refunds?.data[0]?.id,
          refundAmount: charge.amount_refunded,
        }
      );

      logger.info(`Refund processed for payment: ${paymentIntentId}`);
    } catch (error: any) {
      logger.error(`Error handling refund: ${error.message}`);
    }
  }

  /**
   * Get payment methods for a customer
   */
  static async getPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error: any) {
      logger.error(`Error fetching payment methods: ${error.message}`);
      throw new AppError('Failed to fetch payment methods', 500);
    }
  }

  /**
   * Attach payment method to customer
   */
  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return paymentMethod;
    } catch (error: any) {
      logger.error(`Error attaching payment method: ${error.message}`);
      throw new AppError('Failed to attach payment method', 500);
    }
  }

  /**
   * Create a connected account for driver payouts
   */
  static async createConnectedAccount(
    email: string,
    metadata: any = {}
  ): Promise<Stripe.Account> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        metadata,
        capabilities: {
          transfers: { requested: true },
        },
      });

      logger.info(`Connected account created: ${account.id}`);
      return account;
    } catch (error: any) {
      logger.error(`Error creating connected account: ${error.message}`);
      throw new AppError('Failed to create connected account', 500);
    }
  }
}


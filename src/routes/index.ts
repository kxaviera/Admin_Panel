import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import driverRoutes from './driver.routes';
import driverApplicationRoutes from './driverApplication.routes';
import rideRoutes from './ride.routes';
import paymentRoutes from './payment.routes';
import promoRoutes from './promo.routes';
import referralRoutes from './referral.routes';
import uploadRoutes from './upload.routes';
import analyticsRoutes from './analytics.routes';
import walletRoutes from './wallet.routes';
import subscriptionRoutes from './subscription.routes';
import vehicleTypeRoutes from './vehicleType.routes';
import parcelVehicleRoutes from './parcelVehicle.routes';
import parcelRoutes from './parcel.routes';
import notificationRoutes from './notification.routes';
import configRoutes from './config.routes';
import zoneRoutes from './zone.routes';
import sosRoutes from './sos.routes';
import chatRoutes from './chat.routes';
import freightRoutes from './freight.routes';
import fleetManagerRoutes from './fleetManager.routes';
import fleetVehicleRoutes from './fleetVehicle.routes';
import dispatcherRoutes from './dispatcher.routes';
import blogRoutes from './blog.routes';
import pageRoutes from './page.routes';
import faqRoutes from './faq.routes';
import mediaRoutes from './media.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Pikkar API is running',
    timestamp: new Date().toISOString(),
    version: '3.1.0',
    phase: 'Phase 3 - Scale & Polish',
    businessModel: 'Subscription-Based (No Commission)',
    features: {
      wallet: true,
      pushNotifications: true,
      surgePricing: true,
      rateLimiting: true,
      docker: true,
      subscriptions: true,
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/driver-applications', driverApplicationRoutes);
router.use('/rides', rideRoutes);
router.use('/payments', paymentRoutes);
router.use('/promo', promoRoutes);
router.use('/referral', referralRoutes);
router.use('/upload', uploadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/wallet', walletRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/vehicle-types', vehicleTypeRoutes);
router.use('/parcel-vehicles', parcelVehicleRoutes);
router.use('/parcels', parcelRoutes);
router.use('/sos', sosRoutes);
router.use('/chats', chatRoutes);
router.use('/freight', freightRoutes);
router.use('/fleet-managers', fleetManagerRoutes);
router.use('/fleet-vehicles', fleetVehicleRoutes);
router.use('/dispatchers', dispatcherRoutes);
router.use('/blogs', blogRoutes);
router.use('/pages', pageRoutes);
router.use('/faqs', faqRoutes);
router.use('/media', mediaRoutes);
router.use('/notifications', notificationRoutes);
router.use('/config', configRoutes);
router.use('/zones', zoneRoutes);

export default router;


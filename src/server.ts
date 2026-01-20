import app from './app';
import { config } from './config/env';
import connectDB from './config/database';
import logger from './utils/logger';
import { Server } from 'socket.io';
import http from 'http';
import { SubscriptionService } from './services/subscription.service';
import Driver from './models/Driver.model';
import Service from './models/Service';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO for real-time features
const io = new Server(server, {
  cors: {
    // Mobile apps often send no Origin header; allow all origins for sockets.
    // (Auth is handled at the app/API layer via JWT/Firebase exchange.)
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Join room based on user role
  socket.on('join', async (data: { userId: string; role: string }) => {
    const userId = String(data?.userId || '');
    const role = String(data?.role || '');

    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);

    // Targeted driver rooms:
    // - role:driver:ride → ride-capable drivers
    // - role:driver:parcel → parcel-capable drivers
    // Bike typically joins both (if both Services exist).
    if (role === 'driver' && userId) {
      try {
        const driver = await Driver.findOne({ userId }).select('vehicleType');
        const vt = String(driver?.vehicleType || '').toLowerCase().trim();
        if (vt) {
          const canRide = await Service.exists({ category: 'ride', isActive: true, vehicleType: vt });
          const canParcel = await Service.exists({ category: 'parcel', isActive: true, vehicleType: vt });
          if (canRide) socket.join('role:driver:ride');
          if (canParcel) socket.join('role:driver:parcel');
        }
      } catch (e: any) {
        logger.warn(`Socket join eligibility check failed: ${e?.message || e}`);
      }
    }

    logger.info(`User ${userId || '(unknown)'} joined as ${role || '(unknown)'}`);
  });

  // Driver location update
  socket.on('driver:location', (data: { driverId: string; location: any }) => {
    socket.broadcast.emit('driver:location:update', data);
  });

  // Ride request broadcast to nearby drivers
  socket.on('ride:request', (data: any) => {
    io.to('role:driver:ride').emit('ride:new', data);
  });

  // Ride accepted notification to user
  socket.on('ride:accepted', (data: { userId: string; rideData: any }) => {
    io.to(`user:${data.userId}`).emit('ride:accepted', data.rideData);
  });

  // Ride status updates
  socket.on('ride:status', (data: { userId: string; driverId: string; status: string }) => {
    io.to(`user:${data.userId}`).emit('ride:status:update', data);
    io.to(`user:${data.driverId}`).emit('ride:status:update', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Ensure default subscription plans exist
    await SubscriptionService.ensureDefaultPlans();

    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`API documentation available at http://localhost:${config.port}/api/${config.apiVersion}/docs`);
    });
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { io };


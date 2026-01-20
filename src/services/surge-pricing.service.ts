import Ride from '../models/Ride.model';
import Driver from '../models/Driver.model';
import logger from '../utils/logger';

export class SurgePricingService {
  /**
   * Calculate surge multiplier based on demand and supply
   */
  static async calculateSurgeMultiplier(
    latitude: number,
    longitude: number,
    vehicleType: string
  ): Promise<number> {
    const radius = 5000; // 5km radius

    try {
      // Get active rides in area
      const activeRidesCount = await Ride.countDocuments({
        status: { $in: ['requested', 'accepted'] },
        vehicleType,
        'pickupLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radius,
          },
        },
      });

      // Get available drivers in area
      const availableDriversCount = await Driver.countDocuments({
        isOnline: true,
        isAvailable: true,
        status: 'approved',
        vehicleType,
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radius,
          },
        },
      });

      // Calculate demand-supply ratio
      const ratio = availableDriversCount > 0 
        ? activeRidesCount / availableDriversCount 
        : activeRidesCount;

      // Determine surge multiplier
      let surgeMultiplier = 1.0;

      if (ratio >= 3.0) {
        surgeMultiplier = 2.5; // Very high demand
      } else if (ratio >= 2.0) {
        surgeMultiplier = 2.0; // High demand
      } else if (ratio >= 1.5) {
        surgeMultiplier = 1.8;
      } else if (ratio >= 1.0) {
        surgeMultiplier = 1.5;
      } else if (ratio >= 0.7) {
        surgeMultiplier = 1.3;
      } else if (ratio >= 0.5) {
        surgeMultiplier = 1.2;
      }

      // Check time-based surge (peak hours)
      const hour = new Date().getHours();
      const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
      
      if (isPeakHour) {
        surgeMultiplier *= 1.2; // 20% additional surge during peak hours
      }

      // Cap maximum surge
      surgeMultiplier = Math.min(surgeMultiplier, 3.0);

      logger.info(
        `Surge calculation: ${activeRidesCount} rides, ${availableDriversCount} drivers, multiplier: ${surgeMultiplier}`
      );

      return Number(surgeMultiplier.toFixed(2));
    } catch (error: any) {
      logger.error(`Surge pricing error: ${error.message}`);
      return 1.0; // Default to no surge on error
    }
  }

  /**
   * Get surge zones (areas with high surge)
   */
  static async getSurgeZones(): Promise<any[]> {
    // TODO: Implement zone-based surge pricing
    // This would involve geohashing and clustering
    return [];
  }

  /**
   * Check if surge pricing is active in area
   */
  static async isSurgeActive(
    latitude: number,
    longitude: number,
    vehicleType: string
  ): Promise<boolean> {
    const multiplier = await this.calculateSurgeMultiplier(
      latitude,
      longitude,
      vehicleType
    );
    return multiplier > 1.0;
  }

  /**
   * Get surge pricing info for area
   */
  static async getSurgeInfo(
    latitude: number,
    longitude: number,
    vehicleType: string
  ): Promise<any> {
    const multiplier = await this.calculateSurgeMultiplier(
      latitude,
      longitude,
      vehicleType
    );

    return {
      isActive: multiplier > 1.0,
      multiplier,
      message: this.getSurgeMessage(multiplier),
    };
  }

  /**
   * Get user-friendly surge message
   */
  private static getSurgeMessage(multiplier: number): string {
    if (multiplier >= 2.5) {
      return 'Very high demand! Fares are significantly higher.';
    } else if (multiplier >= 2.0) {
      return 'High demand! Fares are higher than usual.';
    } else if (multiplier >= 1.5) {
      return 'Increased demand. Fares are slightly higher.';
    } else if (multiplier > 1.0) {
      return 'Moderate demand. Slight fare increase.';
    }
    return 'Normal pricing';
  }
}


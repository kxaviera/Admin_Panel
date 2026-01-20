import { config } from '../config/env';

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  bookingFee: number;
  surgeFare: number;
  totalFare: number;
  discount: number;
  finalFare: number;
}

const vehicleMultipliers: Record<string, number> = {
  bike: 0.7,
  auto: 0.8,
  sedan: 1.0,
  suv: 1.3,
  luxury: 2.0,
};

export const calculateFare = (
  distanceInKm: number,
  durationInMinutes: number,
  vehicleType: string = 'sedan',
  promoDiscount: number = 0
): FareBreakdown => {
  const multiplier = vehicleMultipliers[vehicleType] || 1.0;

  // Base calculations
  const baseFare = config.fare.baseFare * multiplier;
  const distanceFare = distanceInKm * config.fare.perKmRate * multiplier;
  const timeFare = durationInMinutes * config.fare.perMinuteRate * multiplier;
  const bookingFee = config.fare.bookingFee;

  // Subtotal before surge
  const subtotal = baseFare + distanceFare + timeFare + bookingFee;

  // Apply surge multiplier
  const surgeFare = subtotal * (config.fare.surgeMultiplier - 1);
  const totalFare = subtotal + surgeFare;

  // Apply discount
  const discount = Math.min(promoDiscount, totalFare * 0.5); // Max 50% discount
  const finalFare = Math.max(totalFare - discount, config.fare.minimumFare);

  return {
    baseFare: Math.round(baseFare),
    distanceFare: Math.round(distanceFare),
    timeFare: Math.round(timeFare),
    bookingFee: Math.round(bookingFee),
    surgeFare: Math.round(surgeFare),
    totalFare: Math.round(totalFare),
    discount: Math.round(discount),
    finalFare: Math.round(finalFare),
  };
};


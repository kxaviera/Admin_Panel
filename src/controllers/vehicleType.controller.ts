import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Service from '../models/Service';

// Get all vehicle types (ride vehicles)
export const getVehicleTypes = async (req: AuthRequest, res: Response) => {
  try {
    const category = (req.query.category as string | undefined)?.toLowerCase();
    const resolvedCategory = category === 'delivery' ? 'delivery' : 'ride';

    const vehicles = await Service.find({ category: resolvedCategory })
      .sort({ order: 1 })
      .select('-__v');

    // Compatibility:
    // - Admin dashboard expects: { data: [ ... ] }
    // - Driver app expects: { status:'success', data: { vehicleTypes: [ ... ] } } when category param is provided
    if (category) {
      return res.json({
        status: 'success',
        success: true,
        data: { vehicleTypes: vehicles },
        count: vehicles.length,
      });
    }

    return res.json({
      status: 'success',
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('Get vehicle types error:', error);
    return res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to fetch vehicle types',
      error: error.message,
    });
  }
};

// Get vehicle type by ID
export const getVehicleTypeById = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await Service.findById(req.params.id).select('-__v');
    if (!vehicle) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Vehicle type not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: { vehicleType: vehicle },
    });
  } catch (error: any) {
    console.error('Get vehicle type by ID error:', error);
    return res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to fetch vehicle type',
      error: error.message,
    });
  }
};

// Get active vehicle types
export const getActiveVehicleTypes = async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await Service.find({ 
      category: 'ride',
      isActive: true,
    })
      .sort({ order: 1 })
      .select('-__v');

    res.json({
      status: 'success',
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('Get active vehicle types error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to fetch active vehicle types',
      error: error.message,
    });
  }
};

// Create vehicle type
export const createVehicleType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      description,
      vehicleType,
      icon,
      iconSideView,
      iconTopView,
      iconFrontView,
      capacity,
      pricing,
      features,
      isActive,
    } = req.body;

    const normalizedVehicleType = vehicleType?.toLowerCase();
    const normalizedCode = code?.toLowerCase();

    // Check if code already exists
    const existing = await Service.findOne({ code: normalizedCode, category: 'ride' });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Vehicle type with this code already exists',
      });
      return;
    }

    const vehicle = await Service.create({
      name,
      code: normalizedCode,
      description,
      category: 'ride',
      vehicleType: normalizedVehicleType,
      icon,
      iconSideView,
      iconTopView,
      iconFrontView,
      capacity: {
        passengers: capacity?.passengers || 1,
        luggage: capacity?.luggage || 1,
      },
      pricing: {
        baseFare: pricing?.baseFare || 0,
        perKmRate: pricing?.perKmRate || 0,
        perMinuteRate: pricing?.perMinuteRate || 0,
        minimumFare: pricing?.minimumFare || 0,
        bookingFee: pricing?.bookingFee || 0,
        cancellationFee: pricing?.cancellationFee || 0,
      },
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      order: await Service.countDocuments({ category: 'ride' }) + 1,
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Vehicle type created successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Create vehicle type error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to create vehicle type',
      error: error.message,
    });
  }
};

// Update vehicle type
export const updateVehicleType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Service.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle type not found',
      });
      return;
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Vehicle type updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Update vehicle type error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to update vehicle type',
      error: error.message,
    });
  }
};

// Delete vehicle type
export const deleteVehicleType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vehicle = await Service.findByIdAndDelete(id);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle type not found',
      });
      return;
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Vehicle type deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete vehicle type error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to delete vehicle type',
      error: error.message,
    });
  }
};

// Toggle vehicle type active status
export const toggleVehicleType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vehicle = await Service.findById(id);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle type not found',
      });
      return;
    }

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.json({
      status: 'success',
      success: true,
      message: `Vehicle type ${vehicle.isActive ? 'activated' : 'deactivated'} successfully`,
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Toggle vehicle type error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to toggle vehicle type status',
      error: error.message,
    });
  }
};

// Calculate ride fare
export const calculateRideFare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, distanceKm, timeMinutes } = req.body;

    const vehicle = await Service.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle type not found',
      });
      return;
    }

    if (!vehicle.isActive) {
      res.status(400).json({
        success: false,
        message: 'This vehicle type is not currently available',
      });
      return;
    }

    const baseFare = vehicle.pricing.baseFare || 0;
    const distanceCharge = (distanceKm || 0) * (vehicle.pricing.perKmRate || 0);
    const timeCharge = (timeMinutes || 0) * (vehicle.pricing.perMinuteRate || 0);
    const bookingFee = vehicle.pricing.bookingFee || 0;
    
    let totalFare = baseFare + distanceCharge + timeCharge + bookingFee;
    
    // Apply minimum fare
    if (totalFare < vehicle.pricing.minimumFare) {
      totalFare = vehicle.pricing.minimumFare;
    }

    res.json({
      status: 'success',
      success: true,
      data: {
        vehicleName: vehicle.name,
        vehicleType: vehicle.vehicleType,
        breakdown: {
          baseFare,
          distanceCharge,
          timeCharge,
          bookingFee,
          subtotal: baseFare + distanceCharge + timeCharge + bookingFee,
          minimumFare: vehicle.pricing.minimumFare,
        },
        totalFare: Math.round(totalFare * 100) / 100,
        currency: 'INR',
      },
    });
  } catch (error: any) {
    console.error('Calculate fare error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to calculate fare',
      error: error.message,
    });
  }
};

// Update vehicle pricing only (admin)
export const updateVehiclePricing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pricing = (req.body as any)?.pricing ?? req.body;

    const allowedFields = [
      'baseFare',
      'perKmRate',
      'perMinuteRate',
      'minimumFare',
      'bookingFee',
      'cancellationFee',
    ] as const;

    const nextPricing: any = {};
    for (const key of allowedFields) {
      if (pricing?.[key] !== undefined) {
        const num = Number(pricing[key]);
        if (!Number.isFinite(num) || num < 0) {
          res.status(400).json({
            success: false,
            message: `Invalid pricing.${key}`,
          });
          return;
        }
        nextPricing[`pricing.${key}`] = num;
      }
    }

    if (Object.keys(nextPricing).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No pricing fields provided',
      });
      return;
    }

    const vehicle = await Service.findByIdAndUpdate(
      id,
      { $set: nextPricing },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle type not found',
      });
      return;
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Vehicle pricing updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Update vehicle pricing error:', error);
    res.status(500).json({
      status: 'fail',
      success: false,
      message: 'Failed to update vehicle pricing',
      error: error.message,
    });
  }
};


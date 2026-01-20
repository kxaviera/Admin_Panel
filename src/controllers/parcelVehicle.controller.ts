import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Service from '../models/Service';

// Get all parcel vehicles
export const getParcelVehicles = async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await Service.find({ category: 'parcel' })
      .sort({ order: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('Get parcel vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parcel vehicles',
      error: error.message,
    });
  }
};

// Get active parcel vehicles
export const getActiveParcelVehicles = async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await Service.find({ 
      category: 'parcel',
      isActive: true,
    })
      .sort({ order: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('Get active parcel vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active parcel vehicles',
      error: error.message,
    });
  }
};

// Create parcel vehicle
export const createParcelVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if code already exists
    const existing = await Service.findOne({ code, category: 'parcel' });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Parcel vehicle with this code already exists',
      });
      return;
    }

    const vehicle = await Service.create({
      name,
      code,
      description,
      category: 'parcel',
      vehicleType,
      icon,
      iconSideView,
      iconTopView,
      iconFrontView,
      capacity: {
        weight: capacity?.weight || 0,
        maxWeight: capacity?.maxWeight || 0,
        maxLength: capacity?.maxLength || 0,
        maxWidth: capacity?.maxWidth || 0,
        maxHeight: capacity?.maxHeight || 0,
      },
      pricing: {
        basePrice: pricing?.basePrice || 0,
        pricePerKm: pricing?.pricePerKm || 0,
        pricePerKg: pricing?.pricePerKg || 0,
        minimumPrice: pricing?.minimumPrice || 0,
      },
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      order: await Service.countDocuments({ category: 'parcel' }) + 1,
    });

    res.status(201).json({
      success: true,
      message: 'Parcel vehicle created successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Create parcel vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create parcel vehicle',
      error: error.message,
    });
  }
};

// Update parcel vehicle
export const updateParcelVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
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
        message: 'Parcel vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Parcel vehicle updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Update parcel vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update parcel vehicle',
      error: error.message,
    });
  }
};

// Update parcel vehicle pricing only (admin)
export const updateParcelVehiclePricing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pricing = (req.body as any)?.pricing ?? req.body;

    const allowedFields = ['basePrice', 'pricePerKm', 'pricePerKg', 'minimumPrice'] as const;
    const nextPricing: any = {};

    for (const key of allowedFields) {
      if (pricing?.[key] !== undefined) {
        const num = Number(pricing[key]);
        if (!Number.isFinite(num) || num < 0) {
          res.status(400).json({ success: false, message: `Invalid pricing.${key}` });
          return;
        }
        nextPricing[`pricing.${key}`] = num;
      }
    }

    if (Object.keys(nextPricing).length === 0) {
      res.status(400).json({ success: false, message: 'No pricing fields provided' });
      return;
    }

    const vehicle = await Service.findByIdAndUpdate(
      id,
      { $set: nextPricing },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Parcel vehicle not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Parcel vehicle pricing updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Update parcel vehicle pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update parcel vehicle pricing',
      error: error.message,
    });
  }
};

// Delete parcel vehicle
export const deleteParcelVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vehicle = await Service.findByIdAndDelete(id);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Parcel vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Parcel vehicle deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete parcel vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete parcel vehicle',
      error: error.message,
    });
  }
};

// Toggle parcel vehicle active status
export const toggleParcelVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vehicle = await Service.findById(id);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Parcel vehicle not found',
      });
      return;
    }

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.json({
      success: true,
      message: `Parcel vehicle ${vehicle.isActive ? 'activated' : 'deactivated'} successfully`,
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Toggle parcel vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle parcel vehicle status',
      error: error.message,
    });
  }
};

// Calculate parcel delivery price
export const calculateParcelPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, distanceKm, weightKg, length, width, height } = req.body;

    const vehicle = await Service.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Parcel vehicle not found',
      });
      return;
    }

    if (!vehicle.isActive) {
      res.status(400).json({
        success: false,
        message: 'This parcel vehicle is not currently available',
      });
      return;
    }

    // Check capacity constraints
    const errors = [];
    
    if (weightKg > (vehicle.capacity.maxWeight || 0)) {
      errors.push(`Weight exceeds limit. Max: ${vehicle.capacity.maxWeight} kg`);
    }
    
    if (length && length > (vehicle.capacity.maxLength || 0)) {
      errors.push(`Length exceeds limit. Max: ${vehicle.capacity.maxLength} cm`);
    }
    
    if (width && width > (vehicle.capacity.maxWidth || 0)) {
      errors.push(`Width exceeds limit. Max: ${vehicle.capacity.maxWidth} cm`);
    }
    
    if (height && height > (vehicle.capacity.maxHeight || 0)) {
      errors.push(`Height exceeds limit. Max: ${vehicle.capacity.maxHeight} cm`);
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Parcel exceeds vehicle capacity',
        errors,
      });
      return;
    }

    const basePrice = vehicle.pricing.basePrice || 0;
    const distanceCharge = (distanceKm || 0) * (vehicle.pricing.pricePerKm || 0);
    const weightCharge = (weightKg || 0) * (vehicle.pricing.pricePerKg || 0);
    
    let totalPrice = basePrice + distanceCharge + weightCharge;
    
    // Apply minimum price
    if (totalPrice < (vehicle.pricing.minimumPrice || 0)) {
      totalPrice = vehicle.pricing.minimumPrice || 0;
    }

    res.json({
      success: true,
      data: {
        vehicleName: vehicle.name,
        vehicleType: vehicle.vehicleType,
        breakdown: {
          basePrice,
          distanceCharge,
          weightCharge,
          subtotal: basePrice + distanceCharge + weightCharge,
          minimumPrice: vehicle.pricing.minimumPrice,
        },
        totalPrice: Math.round(totalPrice * 100) / 100,
        currency: 'INR',
        capacityCheck: {
          weightOk: weightKg <= (vehicle.capacity.maxWeight || 0),
          dimensionsOk: true,
        },
      },
    });
  } catch (error: any) {
    console.error('Calculate parcel price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate parcel price',
      error: error.message,
    });
  }
};

// Find suitable vehicles for parcel
export const findSuitableVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const { weightKg, length, width, height, distanceKm } = req.query;

    const query: any = {
      category: 'parcel',
      isActive: true,
    };

    // Filter by capacity
    if (weightKg) {
      query['capacity.maxWeight'] = { $gte: parseFloat(weightKg as string) };
    }
    
    if (length) {
      query['capacity.maxLength'] = { $gte: parseFloat(length as string) };
    }
    
    if (width) {
      query['capacity.maxWidth'] = { $gte: parseFloat(width as string) };
    }
    
    if (height) {
      query['capacity.maxHeight'] = { $gte: parseFloat(height as string) };
    }

    const vehicles = await Service.find(query).sort({ 'pricing.basePrice': 1 });

    // Calculate prices for each vehicle
    const vehiclesWithPrices = vehicles.map(vehicle => {
      const basePrice = vehicle.pricing.basePrice || 0;
      const distanceCharge = (parseFloat(distanceKm as string) || 0) * (vehicle.pricing.pricePerKm || 0);
      const weightCharge = (parseFloat(weightKg as string) || 0) * (vehicle.pricing.pricePerKg || 0);
      
      let totalPrice = basePrice + distanceCharge + weightCharge;
      
      if (totalPrice < (vehicle.pricing.minimumPrice || 0)) {
        totalPrice = vehicle.pricing.minimumPrice || 0;
      }

      return {
        ...vehicle.toObject(),
        estimatedPrice: Math.round(totalPrice * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: vehiclesWithPrices,
      count: vehiclesWithPrices.length,
    });
  } catch (error: any) {
    console.error('Find suitable vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find suitable vehicles',
      error: error.message,
    });
  }
};


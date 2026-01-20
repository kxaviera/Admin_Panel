"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Edit,
  DollarSign,
  Settings,
  TrendingUp,
  Users,
  Package,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function VehiclePricingPage() {
  const queryClient = useQueryClient();
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: async () => {
      const response = await apiClient.vehicleTypes.getAll();
      return response.data.data;
    },
  });

  const vehicles = useMemo(() => vehiclesData || [], [vehiclesData]);

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, pricing }: { id: string; pricing: any }) => apiClient.vehicleTypes.updatePricing(id, { pricing }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      toast.success("Pricing updated");
      setEditingVehicle(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update pricing");
    },
  });

  const [vehicleForm, setVehicleForm] = useState({
    baseFare: "",
    perKmRate: "",
    perMinuteRate: "",
    minimumFare: "",
    bookingFee: "",
    cancellationFee: "",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const openPricingEditor = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      baseFare: String(vehicle.pricing?.baseFare ?? ""),
      perKmRate: String(vehicle.pricing?.perKmRate ?? ""),
      perMinuteRate: String(vehicle.pricing?.perMinuteRate ?? ""),
      minimumFare: String(vehicle.pricing?.minimumFare ?? ""),
      bookingFee: String(vehicle.pricing?.bookingFee ?? ""),
      cancellationFee: String(vehicle.pricing?.cancellationFee ?? ""),
    });
  };

  const savePricing = () => {
    if (!editingVehicle) return;
    const id = editingVehicle._id || editingVehicle.id;
    updatePricingMutation.mutate({
      id,
      pricing: {
        baseFare: parseFloat(vehicleForm.baseFare || "0"),
        perKmRate: parseFloat(vehicleForm.perKmRate || "0"),
        perMinuteRate: parseFloat(vehicleForm.perMinuteRate || "0"),
        minimumFare: parseFloat(vehicleForm.minimumFare || "0"),
        bookingFee: parseFloat(vehicleForm.bookingFee || "0"),
        cancellationFee: parseFloat(vehicleForm.cancellationFee || "0"),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Pricing</h1>
          <p className="text-muted-foreground">Configure pricing for each vehicle type (vehicles are managed separately)</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Types</p>
                <p className="text-3xl font-bold text-green-600">
                  {vehicles.filter((v: any) => v.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Types</p>
                <p className="text-3xl font-bold text-blue-600">
                  {vehicles.length}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Base Fare</p>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{vehicles.length > 0 ? Math.round(vehicles.reduce((sum: number, v: any) => sum + (v.pricing?.baseFare || 0), 0) / vehicles.length) : 0}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-bold text-orange-600">
                  {isLoading ? "Loading..." : "System Active"}
                </p>
              </div>
              <Settings className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle: any) => (
          <Card key={vehicle._id || vehicle.id} className={!vehicle.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 flex flex-col items-center justify-center gap-1">
                    {/* Main Icon */}
                    {vehicle.iconSideView || vehicle.iconImage ? (
                      <img
                        src={vehicle.iconSideView || vehicle.iconImage}
                        alt={vehicle.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-4xl">{vehicle.icon || "🚗"}</div>
                    )}
                    
                    {/* View Indicators */}
                    {(vehicle.iconSideView || vehicle.iconTopView || vehicle.iconFrontView) && (
                      <div className="flex gap-1">
                        {vehicle.iconSideView && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Side view available"></div>
                        )}
                        {vehicle.iconTopView && (
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Top view available"></div>
                        )}
                        {vehicle.iconFrontView && (
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" title="Front view available"></div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle>{vehicle.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{vehicle.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                  {vehicle.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {/* Multiple Views Preview */}
              {(vehicle.iconSideView || vehicle.iconTopView || vehicle.iconFrontView) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Available Views:</p>
                  <div className="flex gap-2">
                    {vehicle.iconSideView && (
                      <div className="relative group">
                        <img
                          src={vehicle.iconSideView}
                          alt="Side view"
                          className="w-12 h-12 object-contain border rounded p-1 hover:border-blue-500 transition-colors"
                        />
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-blue-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          Side
                        </span>
                      </div>
                    )}
                    {vehicle.iconTopView && (
                      <div className="relative group">
                        <img
                          src={vehicle.iconTopView}
                          alt="Top view"
                          className="w-12 h-12 object-contain border rounded p-1 hover:border-green-500 transition-colors"
                        />
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          Top
                        </span>
                      </div>
                    )}
                    {vehicle.iconFrontView && (
                      <div className="relative group">
                        <img
                          src={vehicle.iconFrontView}
                          alt="Front view"
                          className="w-12 h-12 object-contain border rounded p-1 hover:border-purple-500 transition-colors"
                        />
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-purple-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          Front
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base Fare:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.baseFare || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Per KM:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.perKmRate || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Per Min:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.perMinuteRate || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min Fare:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.minimumFare || 0}</span>
                </div>
              </div>

              {/* Capacity */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vehicle.capacity?.passengers || 0} Passengers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vehicle.capacity?.luggage || 0} Bags</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {vehicle.features?.map((feature: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openPricingEditor(vehicle)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editingVehicle)} onOpenChange={(open) => !open && setEditingVehicle(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Pricing</DialogTitle>
            <DialogDescription>
              {editingVehicle ? `Update pricing for ${editingVehicle.name}` : "Update pricing"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Base Fare (₹)</Label>
              <Input type="number" value={vehicleForm.baseFare} onChange={(e) => setVehicleForm({ ...vehicleForm, baseFare: e.target.value })} />
            </div>
            <div>
              <Label>Per KM Rate (₹)</Label>
              <Input type="number" value={vehicleForm.perKmRate} onChange={(e) => setVehicleForm({ ...vehicleForm, perKmRate: e.target.value })} />
            </div>
            <div>
              <Label>Per Minute Rate (₹)</Label>
              <Input type="number" value={vehicleForm.perMinuteRate} onChange={(e) => setVehicleForm({ ...vehicleForm, perMinuteRate: e.target.value })} />
            </div>
            <div>
              <Label>Minimum Fare (₹)</Label>
              <Input type="number" value={vehicleForm.minimumFare} onChange={(e) => setVehicleForm({ ...vehicleForm, minimumFare: e.target.value })} />
            </div>
            <div>
              <Label>Booking Fee (₹)</Label>
              <Input type="number" value={vehicleForm.bookingFee} onChange={(e) => setVehicleForm({ ...vehicleForm, bookingFee: e.target.value })} />
            </div>
            <div>
              <Label>Cancellation Fee (₹)</Label>
              <Input type="number" value={vehicleForm.cancellationFee} onChange={(e) => setVehicleForm({ ...vehicleForm, cancellationFee: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={savePricing} disabled={updatePricingMutation.isPending}>
              {updatePricingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Pricing
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditingVehicle(null)} disabled={updatePricingMutation.isPending}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Edit, DollarSign, TrendingUp, CheckCircle, Loader2, Weight, Ruler } from "lucide-react";

export default function ParcelVehiclePricingPage() {
  const queryClient = useQueryClient();
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ["parcel-vehicles"],
    queryFn: async () => {
      const res = await apiClient.parcelVehicles.getAll();
      return res.data.data;
    },
  });

  const vehicles = useMemo(() => vehiclesData || [], [vehiclesData]);

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, pricing }: { id: string; pricing: any }) => apiClient.parcelVehicles.updatePricing(id, { pricing }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcel-vehicles"] });
      toast.success("Pricing updated");
      setEditingVehicle(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update pricing"),
  });

  const [pricingForm, setPricingForm] = useState({
    basePrice: "",
    pricePerKm: "",
    pricePerKg: "",
    minimumPrice: "",
  });

  const openEditor = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setPricingForm({
      basePrice: String(vehicle.pricing?.basePrice ?? ""),
      pricePerKm: String(vehicle.pricing?.pricePerKm ?? ""),
      pricePerKg: String(vehicle.pricing?.pricePerKg ?? ""),
      minimumPrice: String(vehicle.pricing?.minimumPrice ?? ""),
    });
  };

  const save = () => {
    if (!editingVehicle) return;
    const id = editingVehicle._id || editingVehicle.id;
    updatePricingMutation.mutate({
      id,
      pricing: {
        basePrice: parseFloat(pricingForm.basePrice || "0"),
        pricePerKm: parseFloat(pricingForm.pricePerKm || "0"),
        pricePerKg: parseFloat(pricingForm.pricePerKg || "0"),
        minimumPrice: parseFloat(pricingForm.minimumPrice || "0"),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parcel Vehicle Pricing</h1>
          <p className="text-muted-foreground">Configure parcel pricing (vehicles & capacity are managed separately)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <p className="text-3xl font-bold text-green-600">{vehicles.filter((v: any) => v.isActive).length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                <p className="text-3xl font-bold text-blue-600">{vehicles.length}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Base Price</p>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{vehicles.length > 0 ? Math.round(vehicles.reduce((sum: number, v: any) => sum + (v.pricing?.basePrice || 0), 0) / vehicles.length) : 0}
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
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold text-orange-600">{new Set(vehicles.map((v: any) => v.vehicleType || v.code)).size}</p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle: any) => (
          <Card key={vehicle._id || vehicle.id} className={!vehicle.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 flex items-center justify-center">
                    {vehicle.iconSideView ? (
                      <img src={vehicle.iconSideView} alt={vehicle.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-4xl">{vehicle.icon || "📦"}</div>
                    )}
                  </div>
                  <div>
                    <CardTitle>{vehicle.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{vehicle.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={vehicle.isActive ? "default" : "secondary"}>{vehicle.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.basePrice || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per KM:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.pricePerKm || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per KG:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.pricePerKg || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum:</span>
                  <span className="font-semibold">₹{vehicle.pricing?.minimumPrice || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span>Max {vehicle.capacity?.maxWeight ?? 0}kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {vehicle.capacity?.maxLength ?? 0}×{vehicle.capacity?.maxWidth ?? 0}×{vehicle.capacity?.maxHeight ?? 0}cm
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={() => openEditor(vehicle)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Pricing
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editingVehicle)} onOpenChange={(open) => !open && setEditingVehicle(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Parcel Pricing</DialogTitle>
            <DialogDescription>{editingVehicle ? `Update pricing for ${editingVehicle.name}` : "Update pricing"}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Base Price (₹)</Label>
              <Input type="number" value={pricingForm.basePrice} onChange={(e) => setPricingForm({ ...pricingForm, basePrice: e.target.value })} />
            </div>
            <div>
              <Label>Price per KM (₹)</Label>
              <Input type="number" value={pricingForm.pricePerKm} onChange={(e) => setPricingForm({ ...pricingForm, pricePerKm: e.target.value })} />
            </div>
            <div>
              <Label>Price per KG (₹)</Label>
              <Input type="number" value={pricingForm.pricePerKg} onChange={(e) => setPricingForm({ ...pricingForm, pricePerKg: e.target.value })} />
            </div>
            <div>
              <Label>Minimum Price (₹)</Label>
              <Input type="number" value={pricingForm.minimumPrice} onChange={(e) => setPricingForm({ ...pricingForm, minimumPrice: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={save} disabled={updatePricingMutation.isPending}>
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


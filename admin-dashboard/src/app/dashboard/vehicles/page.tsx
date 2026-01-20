"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Package, CheckCircle, XCircle, Loader2, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: async () => {
      const response = await apiClient.vehicleTypes.getAll();
      return response.data.data;
    },
  });

  const vehicles = useMemo(() => vehiclesData || [], [vehiclesData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.vehicleTypes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      toast.success("Vehicle created");
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create vehicle");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.vehicleTypes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      toast.success("Vehicle updated");
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update vehicle");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.vehicleTypes.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      toast.success("Status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.vehicleTypes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      toast.success("Vehicle deleted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    },
  });

  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    type: "",
    description: "",
    capacity: "",
    luggage: "",
    features: "",
    icon: "",
    iconSideView: "",
    iconTopView: "",
    iconFrontView: "",
    isActive: true,
  });

  const [sideViewPreview, setSideViewPreview] = useState<string | null>(null);
  const [topViewPreview, setTopViewPreview] = useState<string | null>(null);
  const [frontViewPreview, setFrontViewPreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, viewType: "side" | "top" | "front") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (viewType === "side") {
        setSideViewPreview(result);
        setVehicleForm((p) => ({ ...p, iconSideView: result }));
      } else if (viewType === "top") {
        setTopViewPreview(result);
        setVehicleForm((p) => ({ ...p, iconTopView: result }));
      } else {
        setFrontViewPreview(result);
        setVehicleForm((p) => ({ ...p, iconFrontView: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setVehicleForm({
      name: "",
      type: "",
      description: "",
      capacity: "",
      luggage: "",
      features: "",
      icon: "",
      iconSideView: "",
      iconTopView: "",
      iconFrontView: "",
      isActive: true,
    });
    setEditingVehicle(null);
    setSideViewPreview(null);
    setTopViewPreview(null);
    setFrontViewPreview(null);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name || "",
      type: vehicle.type || vehicle.vehicleType || vehicle.code || "",
      description: vehicle.description || "",
      capacity: String(vehicle.capacity?.passengers ?? ""),
      luggage: String(vehicle.capacity?.luggage ?? ""),
      features: (vehicle.features || []).join(", "),
      icon: vehicle.icon || "",
      iconSideView: vehicle.iconSideView || "",
      iconTopView: vehicle.iconTopView || "",
      iconFrontView: vehicle.iconFrontView || "",
      isActive: Boolean(vehicle.isActive),
    });
    setSideViewPreview(vehicle.iconSideView || null);
    setTopViewPreview(vehicle.iconTopView || null);
    setFrontViewPreview(vehicle.iconFrontView || null);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: vehicleForm.name,
      code: vehicleForm.type.toLowerCase(),
      description: vehicleForm.description,
      vehicleType: vehicleForm.type.toLowerCase(),
      capacity: {
        passengers: parseInt(vehicleForm.capacity || "0", 10) || 1,
        luggage: parseInt(vehicleForm.luggage || "0", 10) || 0,
      },
      features: vehicleForm.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      icon: vehicleForm.icon,
      iconSideView: vehicleForm.iconSideView,
      iconTopView: vehicleForm.iconTopView,
      iconFrontView: vehicleForm.iconFrontView,
      isActive: vehicleForm.isActive,
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle._id || editingVehicle.id, data: payload });
    } else {
      // Create with pricing defaults; pricing can be set in Vehicle Pricing page
      createMutation.mutate({
        ...payload,
        pricing: { baseFare: 0, perKmRate: 0, perMinuteRate: 0, minimumFare: 0, bookingFee: 0, cancellationFee: 0 },
      });
    }
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
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicle types (details, icons, capacity). Pricing is configured separately.</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
              <DialogDescription>Vehicle details only. Set pricing in the Vehicle Pricing page.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle Name *</Label>
                  <Input value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Vehicle Type / Code *</Label>
                  <Input value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input value={vehicleForm.description} onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <Label className="text-lg font-semibold mb-3">Vehicle Icons (Optional)</Label>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Side</Label>
                      <div className="mt-2">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "side")} className="hidden" id="side-view-upload" />
                        <label htmlFor="side-view-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          {sideViewPreview ? (
                            <img src={sideViewPreview} alt="Side view preview" className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-xs text-blue-600 font-medium">Upload</span>
                          )}
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-green-600">Top</Label>
                      <div className="mt-2">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "top")} className="hidden" id="top-view-upload" />
                        <label htmlFor="top-view-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                          {topViewPreview ? (
                            <img src={topViewPreview} alt="Top view preview" className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Upload</span>
                          )}
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-purple-600">Front</Label>
                      <div className="mt-2">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "front")} className="hidden" id="front-view-upload" />
                        <label htmlFor="front-view-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                          {frontViewPreview ? (
                            <img src={frontViewPreview} alt="Front view preview" className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-xs text-purple-600 font-medium">Upload</span>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Emoji Icon (Optional)</Label>
                  <Input value={vehicleForm.icon} onChange={(e) => setVehicleForm({ ...vehicleForm, icon: e.target.value })} className="text-center text-2xl" />
                </div>

                <div>
                  <Label>Passenger Capacity *</Label>
                  <Input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} />
                </div>
                <div>
                  <Label>Luggage Capacity</Label>
                  <Input type="number" value={vehicleForm.luggage} onChange={(e) => setVehicleForm({ ...vehicleForm, luggage: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <Label>Features (comma-separated)</Label>
                  <Input value={vehicleForm.features} onChange={(e) => setVehicleForm({ ...vehicleForm, features: e.target.value })} />
                </div>

                <div className="col-span-2 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={vehicleForm.isActive} onChange={(e) => setVehicleForm({ ...vehicleForm, isActive: e.target.checked })} className="w-4 h-4" />
                  <Label>Active (available for booking)</Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
              <Users className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pricing</p>
                <p className="text-sm font-semibold">
                  <Link href="/dashboard/vehicle-pricing" className="text-primary hover:underline inline-flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Manage pricing
                  </Link>
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-500 opacity-20" />
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
                      <div className="text-4xl">{vehicle.icon || "🚗"}</div>
                    )}
                  </div>
                  <div>
                    <CardTitle>{vehicle.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{vehicle.description}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={vehicle.isActive ? "default" : "secondary"}>{vehicle.isActive ? "Active" : "Inactive"}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      const id = vehicle._id || vehicle.id;
                      if (window.confirm("Delete this vehicle?")) deleteMutation.mutate(id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="flex flex-wrap gap-2">
                {(vehicle.features || []).slice(0, 6).map((feature: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(vehicle)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={vehicle.isActive ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleMutation.mutate(vehicle._id || vehicle.id)}
                >
                  {vehicle.isActive ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  {vehicle.isActive ? "Disable" : "Enable"}
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  window.location.href = "/dashboard/vehicle-pricing";
                }}
              >
                Edit Pricing
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SubscriptionPlan } from "@/types";
import toast from "react-hot-toast";

export default function SubscriptionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: rideVehicles } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: async () => {
      const res = await apiClient.vehicleTypes.getAll();
      const payload = res.data?.data;
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { data: parcelVehicles } = useQuery({
    queryKey: ["parcel-vehicles"],
    queryFn: async () => {
      const res = await apiClient.parcelVehicles.getAll();
      const payload = res.data?.data;
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await apiClient.subscriptions.getPlans();
      // Backend returns a plain array for mobile compatibility
      return response.data;
    },
  });

  const { data: activeSubscriptions } = useQuery({
    queryKey: ["active-subscriptions"],
    queryFn: async () => {
      const response = await apiClient.subscriptions.getAll({
        status: "active",
        limit: 10,
      });
      // Backend may return: { data: { subscriptions: [...] } } OR a plain array (older versions)
      const payload = response.data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.subscriptions)) return payload.subscriptions;
      if (Array.isArray(payload?.data?.subscriptions)) return payload.data.subscriptions;
      return [];
    },
  });

  const activeSubscriptionsList = useMemo(() => {
    return Array.isArray(activeSubscriptions) ? activeSubscriptions : [];
  }, [activeSubscriptions]);

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiClient.subscriptions.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Subscription plan created");
      setIsCreateOpen(false);
    },
    onError: () => {
      toast.error("Failed to create subscription plan");
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.subscriptions.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan updated");
      setIsEditOpen(false);
      setSelectedPlan(null);
    },
    onError: () => toast.error("Failed to update plan"),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiClient.subscriptions.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan deactivated");
    },
    onError: () => {
      toast.error("Failed to deactivate plan");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.subscriptions.updatePlan(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan updated");
    },
    onError: () => toast.error("Failed to update plan"),
  });

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appliesToCategory = String(formData.get("appliesToCategory") || "all");
    const serviceIdRaw = String(formData.get("serviceId") || "");
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      duration: formData.get("duration"),
      // Backend stores price in paise
      price: Math.round(Number(formData.get("price")) * 100),
      features: (formData.get("features") as string).split(",").map(f => f.trim()),
      // Vehicle-specific plans:
      // If serviceId is set, backend will normalize appliesToCategory + appliesToVehicleType automatically.
      appliesToCategory,
      ...(serviceIdRaw && serviceIdRaw !== "all" ? { serviceId: serviceIdRaw } : {}),
      isActive: true,
    };
    createPlanMutation.mutate(data);
  };

  const handleUpdatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const formData = new FormData(e.currentTarget);
    const appliesToCategory = String(formData.get("appliesToCategory") || "all");
    const serviceIdRaw = String(formData.get("serviceId") || "");
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      duration: formData.get("duration"),
      price: Math.round(Number(formData.get("price")) * 100),
      features: (formData.get("features") as string).split(",").map(f => f.trim()),
      appliesToCategory,
      ...(serviceIdRaw && serviceIdRaw !== "all" ? { serviceId: serviceIdRaw } : { serviceId: null }),
      isActive: formData.get("isActive") === "true",
    };
    updatePlanMutation.mutate({ id: selectedPlan._id, data });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-gray-600">Manage subscription plans and active subscriptions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan for drivers
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePlan}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="appliesToCategory">Applies to</Label>
                  <select
                    id="appliesToCategory"
                    name="appliesToCategory"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="ride"
                    required
                  >
                    <option value="ride">Ride</option>
                    <option value="parcel">Parcel</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serviceId">Vehicle</Label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="all"
                  >
                    <option value="all">All vehicles</option>
                    {(rideVehicles || []).map((v: any) => (
                      <option key={v._id} value={v._id}>
                        Ride • {v.name} ({v.vehicleType})
                      </option>
                    ))}
                    {(parcelVehicles || []).map((v: any) => (
                      <option key={v._id} value={v._id}>
                        Parcel • {v.name} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Weekly Pro"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short description for drivers"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <select
                    id="duration"
                    name="duration"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="299"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="features">Features (comma-separated)</Label>
                  <Input
                    id="features"
                    name="features"
                    placeholder="Unlimited rides, Priority support"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subscription Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plansLoading ? (
          <div className="col-span-3 flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          plans?.map((plan: SubscriptionPlan) => (
            <Card key={plan._id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant={plan.isActive ? "success" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {(plan.appliesToCategory || "all").toString().toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">
                      {typeof plan.serviceId === "object" && plan.serviceId
                        ? `${(plan.serviceId as any).name} (${(plan.serviceId as any).vehicleType})`
                        : (plan.appliesToVehicleType || "all")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      per {plan.duration.replace("ly", "")}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this plan?")) {
                          deletePlanMutation.mutate(plan._id);
                        }
                      }}
                    >
                      <Trash className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={plan.isActive ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleActiveMutation.mutate({ id: plan._id, isActive: !plan.isActive })}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {plan.updatedAt ? formatDate(plan.updatedAt) : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Plan */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update plan details and activate/deactivate.</DialogDescription>
          </DialogHeader>
          {selectedPlan ? (
            <form onSubmit={handleUpdatePlan}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_appliesToCategory">Applies to</Label>
                  <select
                    id="edit_appliesToCategory"
                    name="appliesToCategory"
                    defaultValue={String(selectedPlan.appliesToCategory || "all")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="ride">Ride</option>
                    <option value="parcel">Parcel</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_serviceId">Vehicle</Label>
                  <select
                    id="edit_serviceId"
                    name="serviceId"
                    defaultValue={
                      typeof selectedPlan.serviceId === "object" && selectedPlan.serviceId
                        ? (selectedPlan.serviceId as any)._id
                        : "all"
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All vehicles</option>
                    {(rideVehicles || []).map((v: any) => (
                      <option key={v._id} value={v._id}>
                        Ride • {v.name} ({v.vehicleType})
                      </option>
                    ))}
                    {(parcelVehicles || []).map((v: any) => (
                      <option key={v._id} value={v._id}>
                        Parcel • {v.name} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_name">Plan Name</Label>
                  <Input id="edit_name" name="name" defaultValue={selectedPlan.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Input id="edit_description" name="description" defaultValue={selectedPlan.description} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_duration">Duration</Label>
                  <select
                    id="edit_duration"
                    name="duration"
                    defaultValue={selectedPlan.duration}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_price">Price (₹)</Label>
                  <Input
                    id="edit_price"
                    name="price"
                    type="number"
                    defaultValue={Math.round((selectedPlan.price || 0) / 100)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_features">Features (comma-separated)</Label>
                  <Input
                    id="edit_features"
                    name="features"
                    defaultValue={(selectedPlan.features || []).join(", ")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_active">Active</Label>
                  <select
                    id="edit_active"
                    name="isActive"
                    defaultValue={String(Boolean(selectedPlan.isActive))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Driver Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSubscriptionsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active subscriptions
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Rides Completed</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSubscriptionsList.map((sub: any) => (
                  <TableRow key={sub._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {typeof sub.driverId === 'object'
                            ? sub.driverId?.name
                            : "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {typeof sub.driverId === 'object'
                            ? sub.driverId?.email
                            : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof sub.planId === 'object'
                        ? sub.planId?.name
                        : "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(sub.startDate)}</TableCell>
                    <TableCell>{formatDate(sub.endDate)}</TableCell>
                    <TableCell>{sub.ridesCompleted || 0}</TableCell>
                    <TableCell>
                      {formatCurrency(sub.totalEarnings || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{sub.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


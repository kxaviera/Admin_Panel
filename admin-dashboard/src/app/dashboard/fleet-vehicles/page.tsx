"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Car, Plus, Search, Loader2, Trash2 } from "lucide-react";

export default function FleetVehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["fleet-vehicles", search],
    queryFn: async () => {
      const res = await apiClient.fleetVehicles.getAll({ page: 1, limit: 50, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const vehicles = useMemo(() => data?.fleetVehicles ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.fleetVehicles.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      toast.success("Fleet vehicle created");
      setIsCreateOpen(false);
      setForm({ fleetNumber: "", vehicleNumber: "", make: "", model: "", year: "", color: "", vehicleType: "sedan" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create fleet vehicle"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.fleetVehicles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      toast.success("Fleet vehicle deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
  });

  const [form, setForm] = useState({
    fleetNumber: "",
    vehicleNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    vehicleType: "sedan",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_service": return "bg-green-100 text-green-800";
      case "available": return "bg-blue-100 text-blue-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet Vehicles</h1>
          <p className="text-muted-foreground">Manage all fleet vehicles</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Fleet Vehicle</DialogTitle>
              <DialogDescription>Add a new fleet vehicle record.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fleet Number</Label>
                <Input value={form.fleetNumber} onChange={(e) => setForm({ ...form, fleetNumber: e.target.value })} />
              </div>
              <div>
                <Label>Vehicle Number</Label>
                <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Vehicle Type</Label>
                <Input value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() =>
                  createMutation.mutate({
                    ...form,
                    year: parseInt(form.year || "0", 10),
                  })
                }
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-sm text-muted-foreground">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === "in_service").length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === "available").length}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === "maintenance").length}</p>
            <p className="text-sm text-muted-foreground">Maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>Manage fleet vehicles and assignments</CardDescription>
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{(error as any)?.message || "Failed to load fleet vehicles"}</div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fleet Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Assigned Driver</TableHead>
                <TableHead>Total Rides</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle: any) => (
                <TableRow key={vehicle._id || vehicle.id}>
                  <TableCell className="font-medium">{vehicle.fleetNumber}</TableCell>
                  <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.assignedDriver ? "Assigned" : "Unassigned"}</TableCell>
                  <TableCell>{vehicle.totalRides || 0}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const id = vehicle._id || vehicle.id;
                        if (window.confirm("Delete this fleet vehicle?")) deleteMutation.mutate(id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


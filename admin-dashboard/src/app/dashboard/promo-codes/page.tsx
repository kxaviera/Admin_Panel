"use client";

import { useState } from "react";
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
import { PromoCode } from "@/types";
import toast from "react-hot-toast";

export default function PromoCodesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const response = await apiClient.promo.getAll();
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.promo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code created");
      setIsCreateOpen(false);
    },
    onError: () => {
      toast.error("Failed to create promo code");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.promo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code deleted");
    },
    onError: () => {
      toast.error("Failed to delete promo code");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code"),
      type: formData.get("type"),
      value: Number(formData.get("value")),
      maxDiscount: Number(formData.get("maxDiscount")),
      minRideAmount: Number(formData.get("minRideAmount")),
      maxUses: Number(formData.get("maxUses")),
      validFrom: formData.get("validFrom"),
      validTo: formData.get("validTo"),
      applicableFor: formData.get("applicableFor"),
      isActive: true,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-gray-600">Manage promotional campaigns</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
              <DialogDescription>
                Add a new promotional code for users
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    placeholder="20"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                  <Input
                    id="maxDiscount"
                    name="maxDiscount"
                    type="number"
                    placeholder="200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minRideAmount">Min Ride Amount (₹)</Label>
                  <Input
                    id="minRideAmount"
                    name="minRideAmount"
                    type="number"
                    placeholder="100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    placeholder="1000"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="date"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validTo">Valid To</Label>
                  <Input
                    id="validTo"
                    name="validTo"
                    type="date"
                    required
                  />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="applicableFor">Applicable For</Label>
                  <select
                    id="applicableFor"
                    name="applicableFor"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="all">All Users</option>
                    <option value="new_users">New Users Only</option>
                    <option value="specific_users">Specific Users</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Promo Code"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !promoCodes || promoCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No promo codes found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo: PromoCode) => (
                  <TableRow key={promo._id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-semibold">{promo.code}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {promo.applicableFor.replace("_", " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {promo.type === "percentage"
                            ? `${promo.value}%`
                            : formatCurrency(promo.value)}
                        </p>
                        {promo.maxDiscount && (
                          <p className="text-xs text-gray-500">
                            Max: {formatCurrency(promo.maxDiscount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {promo.usedCount} / {promo.maxUses}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${(promo.usedCount / promo.maxUses) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(promo.validFrom)}</p>
                        <p className="text-gray-500">to {formatDate(promo.validTo)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.isActive ? "success" : "secondary"}>
                        {promo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this promo code?")) {
                              deleteMutation.mutate(promo._id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
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


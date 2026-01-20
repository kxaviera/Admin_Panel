"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Eye, Ban } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

export default function ParcelsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedParcel, setSelectedParcel] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["parcels", page, searchQuery, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 10, search: searchQuery };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await apiClient.parcels.getAll(params);
      return res.data;
    },
  });

  const parcels = data?.data?.parcels ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, limit: 10, total: parcels.length, pages: 1 };

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => apiClient.parcels.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      toast.success("Parcel cancelled");
      setIsCancelOpen(false);
      setCancelReason("");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to cancel parcel");
    },
  });

  const rows = useMemo(() => {
    const formatInr = (amount?: number | null) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount || 0));

    return parcels.map((p: any) => {
      const sender = p?.senderInfo?.name ?? "-";
      const recipient = p?.recipientInfo?.name ?? "-";
      const weight = p?.parcelDetails?.weight != null ? `${p.parcelDetails.weight}kg` : "-";
      // Parcel fare is stored as rupees (not paise)
      const fare = typeof p?.fare === "number" ? formatInr(p.fare) : "-";
      return {
        id: p?._id ?? p?.id ?? "-",
        trackingNumber: p?.trackingNumber ?? "-",
        sender,
        recipient,
        weight,
        fare,
        status: p?.status ?? "-",
        raw: p,
      };
    });
  }, [parcels]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "in_transit": return "bg-blue-100 text-blue-800";
      case "picked_up": return "bg-purple-100 text-purple-800";
      case "assigned": return "bg-indigo-100 text-indigo-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parcel Deliveries</h1>
          <p className="text-muted-foreground">Manage all parcel delivery orders</p>
        </div>
        <div className="flex gap-4">
          <Card className="w-32">
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{rows.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Parcels</CardTitle>
          <CardDescription>Track and manage parcel deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Search tracking / sender / recipient / phone"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-80"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="pending">pending</option>
                <option value="assigned">assigned</option>
                <option value="picked_up">picked_up</option>
                <option value="in_transit">in_transit</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} / {pagination.pages}
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">
              {(error as any)?.message ?? "Failed to load parcels"}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((parcel: any) => (
                <TableRow key={parcel.id}>
                  <TableCell className="font-medium">{parcel.trackingNumber}</TableCell>
                  <TableCell>{parcel.sender}</TableCell>
                  <TableCell>{parcel.recipient}</TableCell>
                  <TableCell>{parcel.weight}</TableCell>
                  <TableCell>{parcel.fare}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(parcel.status)}>{parcel.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await apiClient.parcels.getById(parcel.id);
                            setSelectedParcel(res.data?.data?.parcel ?? parcel.raw);
                            setIsDetailOpen(true);
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message ?? "Failed to load parcel");
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {parcel.status !== "delivered" && parcel.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParcel(parcel.raw);
                            setIsCancelOpen(true);
                          }}
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parcel Details</DialogTitle>
            <DialogDescription>Full parcel payload from backend</DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto max-h-[60vh]">
            {JSON.stringify(selectedParcel, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Parcel</DialogTitle>
            <DialogDescription>Provide a reason (optional)</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                const id = (selectedParcel?._id ?? selectedParcel?.id ?? "").toString();
                if (!id) return;
                cancelMutation.mutate({ id, reason: cancelReason || undefined });
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Parcel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


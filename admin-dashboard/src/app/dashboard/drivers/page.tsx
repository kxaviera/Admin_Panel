"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Filter, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function DriversPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [radiusEdits, setRadiusEdits] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["drivers", page, searchQuery],
    queryFn: async () => {
      const response = await apiClient.drivers.getAll({
        page,
        limit: 10,
        search: searchQuery,
      });
      return response.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      apiClient.drivers.verify(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver verification updated");
    },
    onError: () => {
      toast.error("Failed to update driver verification");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, searchRadiusKm }: { id: string; searchRadiusKm: number }) =>
      apiClient.drivers.update(id, { searchRadiusKm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver radius updated");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to update driver radius");
    },
  });

  const drivers = useMemo(() => {
    const arr = data?.data?.drivers;
    return Array.isArray(arr) ? arr : [];
  }, [data]);
  const pagination = data?.data?.pagination || {};

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Verified</Badge>;
      case "rejected":
        return <Badge variant="error">Rejected</Badge>;
      case "suspended":
        return <Badge variant="error">Suspended</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drivers</h1>
          <p className="text-gray-600">Manage driver accounts and verifications</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search drivers by name, email, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers ({pagination.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No drivers found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Rides</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Radius (km)</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver: any) => {
                    const u = driver.userId || {};
                    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Driver";
                    const initial = name.charAt(0).toUpperCase();
                    const vehicleLine = `${driver.vehicleNumber || "-"} • ${driver.vehicleType || "-"}`;
                    const online = Boolean(driver.isOnline) && String(driver.status) === "approved";
                    const id = String(driver._id || "");
                    const currentRadius = typeof driver.searchRadiusKm === "number" ? driver.searchRadiusKm : 5;
                    const draft = radiusEdits[id] ?? String(currentRadius);
                    return (
                    <TableRow key={driver._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                            {initial}
                          </div>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-gray-500">{u.email || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{driver.vehicleMake} {driver.vehicleModel}</p>
                          <p className="text-sm text-gray-500">
                            {vehicleLine}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{u.phone || "-"}</TableCell>
                      <TableCell>{driver.totalRides || 0}</TableCell>
                      <TableCell>
                        {driver.rating ? (
                          <div className="flex items-center">
                            <span className="font-medium">
                              {driver.rating.toFixed(1)}
                            </span>
                            <span className="text-yellow-500 ml-1">★</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-24"
                            inputMode="decimal"
                            value={draft}
                            onChange={(e) =>
                              setRadiusEdits((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending || id.length === 0}
                            onClick={() => {
                              const v = Number(draft);
                              if (!Number.isFinite(v) || v <= 0) {
                                toast.error("Enter a valid km value");
                                return;
                              }
                              updateMutation.mutate({ id, searchRadiusKm: v });
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVerificationBadge(driver.status)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={online ? "success" : "secondary"}
                        >
                          {online ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {driver.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  verifyMutation.mutate({
                                    id: driver._id,
                                    status: "approved",
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  verifyMutation.mutate({
                                    id: driver._id,
                                    status: "rejected",
                                  })
                                }
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>

              {/* Pagination */}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Download, Eye, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RidesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["rides", page, searchQuery, statusFilter],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 10,
        // backend currently doesn't filter by search, but keep for future compatibility
        search: searchQuery,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiClient.rides.getAll(params);
      return response.data;
    },
  });

  const rides = useMemo(() => {
    const arr = data?.data?.rides;
    return Array.isArray(arr) ? arr : [];
  }, [data]);
  const pagination = data?.data?.pagination || {};

  const formatInr = (amount?: number | null) => {
    const n = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      requested: "warning",
      accepted: "default",
      arrived: "default",
      started: "default",
      completed: "success",
      cancelled: "error",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rides</h1>
          <p className="text-gray-600">Monitor all rides on the platform</p>
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
                placeholder="Search rides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="requested">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="arrived">Arrived</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Rides Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Rides ({pagination.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rides found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ride ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Pickup & Dropoff</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map((ride: any) => {
                    const userName =
                      ride?.userId
                        ? `${ride.userId.firstName || ""} ${ride.userId.lastName || ""}`.trim() || "User"
                        : "N/A";
                    const driverName =
                      ride?.driverId?.userId
                        ? `${ride.driverId.userId.firstName || ""} ${ride.driverId.userId.lastName || ""}`.trim() || "Driver"
                        : ride?.driverId
                          ? "Assigned"
                          : "Not assigned";
                    const fareValue =
                      (typeof ride?.fare === "number" ? ride.fare : ride?.fare?.finalFare) ??
                      ride?.estimatedFare ??
                      0;
                    return (
                    <TableRow key={ride._id}>
                      <TableCell className="font-mono text-sm">
                        {ride._id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {userName}
                      </TableCell>
                      <TableCell>
                        {driverName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {ride.pickupLocation?.address}
                            </p>
                          </div>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {ride.dropoffLocation?.address}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{ride.distance?.toFixed(1)} km</TableCell>
                      <TableCell className="font-semibold">
                        {formatInr(fareValue)}
                      </TableCell>
                      <TableCell>{getStatusBadge(ride.status)}</TableCell>
                      <TableCell>{formatDate(ride.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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


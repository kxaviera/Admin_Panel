"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
const SOSAlertsMap = dynamic(
  () => import("@/components/sos/SOSAlertsMap").then((m) => m.SOSAlertsMap),
  { ssr: false, loading: () => <div className="text-muted-foreground">Loading map…</div> }
);
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  Car,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function SOSPage() {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sos", search],
    queryFn: async () => {
      const res = await apiClient.sos.getAll({ page: 1, limit: 50, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const sosAlerts = useMemo(() => data?.sos ?? [], [data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.sos.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sos"] });
      toast.success("SOS updated");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update SOS"),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-500 text-white";
      case "responded": return "bg-blue-500 text-white";
      case "resolved": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <AlertCircle className="h-4 w-4" />;
      case "responded": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const selected = useMemo(() => {
    if (!selectedAlert) return null;
    return sosAlerts.find((a: any) => (a._id || a.id) === selectedAlert) || null;
  }, [selectedAlert, sosAlerts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            SOS Emergency Alerts
          </h1>
          <p className="text-muted-foreground">Monitor and respond to emergency situations</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {sosAlerts.filter((a: any) => a.status === "active").length} Active Alerts
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold text-red-600">
                  {sosAlerts.filter((a: any) => a.priority === "critical" && a.status === "active").length}
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold text-orange-600">
                  {sosAlerts.filter((a: any) => a.priority === "high" && a.status === "active").length}
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">
                  {sosAlerts.filter((a: any) => a.status === "responded").length}
                </p>
              </div>
              <Clock className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {sosAlerts.filter((a: any) => a.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Emergency Alerts</CardTitle>
            <CardDescription>Click on an alert to view details</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-red-600 text-sm">{(error as any)?.message || "Failed to load SOS"}</div>
            ) : null}
            <div className="space-y-3">
              {sosAlerts.map((alert: any) => {
                const id = alert._id || alert.id;
                const userName = alert.userId
                  ? `${alert.userId.firstName || ""} ${alert.userId.lastName || ""}`.trim() || "User"
                  : "User";
                const driverName =
                  alert.driverId?.userId
                    ? `${alert.driverId.userId.firstName || ""} ${alert.driverId.userId.lastName || ""}`.trim() || "Driver"
                    : "Driver";
                const address = alert.location?.address || "-";

                return (
                <div
                  key={id}
                  onClick={() => setSelectedAlert(id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAlert === id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${alert.priority === "critical" && alert.status === "active" ? "animate-pulse" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(alert.status)}
                          {alert.status}
                        </span>
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "-"}
                    </span>
                  </div>

                  <p className="font-semibold text-lg mb-2">{alert.reason}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{driverName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{alert.userPhone || "-"}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </CardContent>
        </Card>

        {/* Alert Details */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
            <CardDescription>
              {selectedAlert ? "Quick actions and information" : "Select an alert to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                {(() => {
                  const alert: any = selected;
                  const coords = alert.location?.coordinates || [];
                  const address = alert.location?.address || "-";
                  const rideId = alert.rideId?._id || alert.rideId || "-";
                  const userName = alert.userId
                    ? `${alert.userId.firstName || ""} ${alert.userId.lastName || ""}`.trim() || "User"
                    : "User";

                  return (
                    <>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Alert ID</p>
                          <p className="font-mono font-semibold">{alert._id || alert.id}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Ride ID</p>
                          <p className="font-mono font-semibold">{rideId}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Location</p>
                          <p className="font-semibold">{address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {coords[1] ?? "-"}, {coords[0] ?? "-"}
                          </p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Contact</p>
                          <p className="font-semibold">{userName}</p>
                          <p className="text-sm text-muted-foreground">{alert.userPhone || "-"}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Button className="w-full" variant="destructive">
                          <Phone className="mr-2 h-4 w-4" />
                          Call User
                        </Button>
                        <Button className="w-full" variant="outline">
                          <Phone className="mr-2 h-4 w-4" />
                          Call Driver
                        </Button>
                        <Button className="w-full" variant="outline">
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Location
                        </Button>
                        {alert.status === "active" && (
                          <Button
                            className="w-full"
                            variant="default"
                            onClick={() => updateStatusMutation.mutate({ id: alert._id || alert.id, status: "responded" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Mark as Responded
                          </Button>
                        )}
                        {alert.status === "responded" && (
                          <Button
                            className="w-full"
                            variant="default"
                            onClick={() => updateStatusMutation.mutate({ id: alert._id || alert.id, status: "resolved" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Resolved
                          </Button>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Emergency Services</p>
                        <div className="space-y-2">
                          <Button className="w-full" variant="outline" size="sm">
                            🚓 Contact Police
                          </Button>
                          <Button className="w-full" variant="outline" size="sm">
                            🚑 Contact Ambulance
                          </Button>
                          <Button className="w-full" variant="outline" size="sm">
                            🚒 Contact Fire Department
                          </Button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select an emergency alert to view details and take action</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Live Location Map</CardTitle>
          <CardDescription>Live tracking of emergency alert locations</CardDescription>
        </CardHeader>
        <CardContent>
          <SOSAlertsMap alerts={sosAlerts} selectedId={selectedAlert} onSelect={(id) => setSelectedAlert(id)} />
        </CardContent>
      </Card>
    </div>
  );
}


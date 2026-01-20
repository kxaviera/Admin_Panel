"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { 
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertCircle
} from "lucide-react";

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.serviceCategory = categoryFilter;
      if (search.trim()) params.q = search.trim();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await apiClient.driverApplications.getAll(params);
      setApplications(res.data.data.applications || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load driver applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStats = useMemo(() => {
    return {
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      total: applications.length,
    };
  }, [applications]);

  const getCategoryBadge = (c?: string) => {
    const val = (c || "ride").toLowerCase();
    const variant = val === "parcel" ? "warning" : val === "both" ? "default" : "secondary";
    return <Badge variant={variant}>{val}</Badge>;
  };

  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: "",
    make: "",
    model: "",
    year: "",
    vehicleNumber: "",
    color: "",
    registrationDate: "",
    insurance: "",
    insuranceExpiry: "",
    pollution: "",
    pollutionExpiry: "",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Driver Applications</h1>
          <p className="text-muted-foreground">Review and approve new driver registrations</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {filteredStats.pending}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {filteredStats.approved}
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
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {filteredStats.rejected}
                </p>
              </div>
              <XCircle className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-primary">
                  {filteredStats.total}
                </p>
              </div>
              <User className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by status, search, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="ride">Ride</option>
                <option value="parcel">Parcel</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Name / phone / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={fetchApplications} disabled={loading}>
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>Review documents and approve drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Driver Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell className="font-medium">{app._id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{getCategoryBadge(app.serviceCategory)}</TableCell>
                  <TableCell>{new Date(app.createdAt).toISOString().slice(0, 10)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {Object.entries(app.documents || {}).map(([key, doc]: any) => (
                        <div
                          key={key}
                          className={`w-2 h-2 rounded-full ${
                            doc?.url
                              ? doc?.verified
                                ? "bg-green-500"
                                : "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          title={`${key}: ${doc?.url ? (doc?.verified ? "Verified" : "Pending") : "Missing"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(app.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(app.status)}
                        {app.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Driver Application Review</DialogTitle>
                          <DialogDescription>
                            Review documents and add vehicle details to approve
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Driver Info */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Driver Information</h3>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-semibold">{app.firstName} {app.lastName}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Phone</Label>
                                <p className="font-semibold">{app.phone}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-semibold">{app.email}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Applied Date</Label>
                                <p className="font-semibold">{new Date(app.createdAt).toISOString().slice(0, 10)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Documents */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
                            <div className="space-y-3">
                              {[
                                { key: "license", label: "Driving License" },
                                { key: "aadhar", label: "Aadhar Card" },
                                { key: "photo", label: "Profile Photo" },
                                { key: "backgroundCheck", label: "Background Check" },
                              ].map(({ key, label }) => {
                                const doc = (app.documents || {})[key];
                                return (
                                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium">{label}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {doc?.url ? "Uploaded" : "Not uploaded"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {doc?.url && (
                                        <>
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                          <Button
                                            variant={doc?.verified ? "default" : "outline"}
                                            size="sm"
                                          >
                                            {doc?.verified ? (
                                              <>
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Verified
                                              </>
                                            ) : (
                                              "Verify"
                                            )}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Vehicle Details Form */}
                          {app.status === "pending" && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Add Vehicle Details</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Vehicle Type *</Label>
                                  <select 
                                    className="w-full mt-1 p-2 border rounded-md"
                                    value={vehicleForm.vehicleType}
                                    onChange={(e) => setVehicleForm({...vehicleForm, vehicleType: e.target.value})}
                                  >
                                    <option value="">Select Type</option>
                                    <option value="bike">Bike</option>
                                    <option value="auto">Auto</option>
                                    <option value="sedan">Sedan</option>
                                    <option value="suv">SUV</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Vehicle Make *</Label>
                                  <Input 
                                    placeholder="e.g., Honda"
                                    value={vehicleForm.make}
                                    onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Vehicle Model *</Label>
                                  <Input 
                                    placeholder="e.g., Activa"
                                    value={vehicleForm.model}
                                    onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Year *</Label>
                                  <Input 
                                    placeholder="e.g., 2023"
                                    value={vehicleForm.year}
                                    onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Vehicle Number *</Label>
                                  <Input 
                                    placeholder="e.g., MH01AB1234"
                                    value={vehicleForm.vehicleNumber}
                                    onChange={(e) => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Color *</Label>
                                  <Input 
                                    placeholder="e.g., Black"
                                    value={vehicleForm.color}
                                    onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Registration Date</Label>
                                  <Input 
                                    type="date"
                                    value={vehicleForm.registrationDate}
                                    onChange={(e) => setVehicleForm({...vehicleForm, registrationDate: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Insurance Number</Label>
                                  <Input 
                                    placeholder="Insurance policy number"
                                    value={vehicleForm.insurance}
                                    onChange={(e) => setVehicleForm({...vehicleForm, insurance: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Insurance Expiry</Label>
                                  <Input 
                                    type="date"
                                    value={vehicleForm.insuranceExpiry}
                                    onChange={(e) => setVehicleForm({...vehicleForm, insuranceExpiry: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Pollution Certificate</Label>
                                  <Input 
                                    placeholder="PUC number"
                                    value={vehicleForm.pollution}
                                    onChange={(e) => setVehicleForm({...vehicleForm, pollution: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Pollution Expiry</Label>
                                  <Input 
                                    type="date"
                                    value={vehicleForm.pollutionExpiry}
                                    onChange={(e) => setVehicleForm({...vehicleForm, pollutionExpiry: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Vehicle Details Display (if approved) */}
                          {app.vehicleDetails && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Vehicle Details</h3>
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-muted-foreground">Type</Label>
                                  <p className="font-semibold capitalize">{app.vehicleDetails.vehicleType}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Make & Model</Label>
                                  <p className="font-semibold">
                                    {app.vehicleDetails.make} {app.vehicleDetails.model}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Year</Label>
                                  <p className="font-semibold">{app.vehicleDetails.year}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Number</Label>
                                  <p className="font-semibold">{app.vehicleDetails.vehicleNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Color</Label>
                                  <p className="font-semibold">{app.vehicleDetails.color}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t">
                            {app.status === "pending" && (
                              <>
                                <Button className="flex-1" variant="default">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Driver
                                </Button>
                                <Button className="flex-1" variant="destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject Application
                                </Button>
                              </>
                            )}
                            {app.status === "approved" && (
                              <Badge className="bg-green-100 text-green-800 py-2 px-4">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Already Approved
                              </Badge>
                            )}
                            {app.status === "rejected" && (
                              <div className="w-full">
                                <Badge className="bg-red-100 text-red-800 py-2 px-4 mb-2">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Application Rejected
                                </Badge>
                                {app.rejectionReason && (
                                  <p className="text-sm text-muted-foreground">
                                    Reason: {app.rejectionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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


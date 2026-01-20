"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Grid, Plus, Car, Package, Truck } from "lucide-react";

export default function ServicesPage() {
  const services = [
    { id: "1", name: "Economy Ride", category: "ride", vehicleType: "sedan", baseFare: "$3", perKm: "$0.80", status: "active", icon: Car },
    { id: "2", name: "Premium Ride", category: "ride", vehicleType: "luxury", baseFare: "$8", perKm: "$1.50", status: "active", icon: Car },
    { id: "3", name: "Parcel Delivery", category: "parcel", vehicleType: "bike", baseFare: "$2", perKm: "$0.50", status: "active", icon: Package },
    { id: "4", name: "Freight Transport", category: "freight", vehicleType: "truck", baseFare: "$20", perKm: "$3.00", status: "active", icon: Truck },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ride": return "bg-blue-100 text-blue-800";
      case "parcel": return "bg-green-100 text-green-800";
      case "freight": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage service types and pricing</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Service
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Grid className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{services.length}</p>
            <p className="text-sm text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{services.filter(s => s.category === "ride").length}</p>
            <p className="text-sm text-muted-foreground">Ride Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{services.filter(s => s.category === "parcel").length}</p>
            <p className="text-sm text-muted-foreground">Parcel Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Truck className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{services.filter(s => s.category === "freight").length}</p>
            <p className="text-sm text-muted-foreground">Freight Services</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>Configure services and pricing models</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Base Fare</TableHead>
                <TableHead>Per KM Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <service.icon className="h-4 w-4" />
                      {service.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{service.vehicleType}</TableCell>
                  <TableCell>{service.baseFare}</TableCell>
                  <TableCell>{service.perKm}</TableCell>
                  <TableCell>
                    <Badge variant={service.status === "active" ? "default" : "secondary"}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Configure</Button>
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


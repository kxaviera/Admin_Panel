"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";

export default function ZonesPage() {
  const zones = [
    { id: "1", name: "Downtown", code: "DT", city: "New York", baseFare: "$5", perKm: "$1.50", status: "active", drivers: 45 },
    { id: "2", name: "Airport", code: "AP", city: "New York", baseFare: "$8", perKm: "$2.00", status: "active", drivers: 32 },
    { id: "3", name: "Suburbs", code: "SB", city: "New York", baseFare: "$4", perKm: "$1.20", status: "active", drivers: 28 },
    { id: "4", name: "Industrial", code: "IN", city: "New York", baseFare: "$6", perKm: "$1.80", status: "inactive", drivers: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zones</h1>
          <p className="text-muted-foreground">Manage service areas and pricing zones</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Zone
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Map className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{zones.length}</p>
            <p className="text-sm text-muted-foreground">Total Zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Map className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{zones.filter(z => z.status === "active").length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Map className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{zones.reduce((sum, z) => sum + z.drivers, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Map className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{new Set(zones.map(z => z.city)).size}</p>
            <p className="text-sm text-muted-foreground">Cities</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Zones</CardTitle>
          <CardDescription>Manage geographic zones and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Base Fare</TableHead>
                <TableHead>Per KM Rate</TableHead>
                <TableHead>Active Drivers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.code}</TableCell>
                  <TableCell>{zone.city}</TableCell>
                  <TableCell>{zone.baseFare}</TableCell>
                  <TableCell>{zone.perKm}</TableCell>
                  <TableCell>{zone.drivers}</TableCell>
                  <TableCell>
                    <Badge variant={zone.status === "active" ? "default" : "secondary"}>
                      {zone.status}
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


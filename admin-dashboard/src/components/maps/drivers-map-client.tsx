"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

// Fix default marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type DriverState = "offline" | "available" | "busy" | "on_trip";

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const heat = (L as any).heatLayer(points, { radius: 22, blur: 18, maxZoom: 14 }).addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

export default function DriversMapClient() {
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>("ALL");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [data, setData] = useState<{ counts: any; drivers: any[] } | null>(null);

  const selectedZone = useMemo(() => {
    if (selectedZoneCode === "ALL") return null;
    return zones.find((z) => z.code === selectedZoneCode) || null;
  }, [zones, selectedZoneCode]);

  const zonePolygonLatLngs = useMemo(() => {
    if (!selectedZone?.geometry?.coordinates?.[0]) return null;
    // GeoJSON Polygon: [[[lng,lat],...]]
    return selectedZone.geometry.coordinates[0].map((c: number[]) => [c[1], c[0]]);
  }, [selectedZone]);

  const heatPoints = useMemo<[number, number, number][]>(() => {
    if (!data?.drivers?.length) return [];
    return data.drivers
      .map((d) => {
        if (typeof d.lat !== "number" || typeof d.lng !== "number") return null;
        if (d.lat === 0 && d.lng === 0) return null;
        const w = d.state === "on_trip" ? 1.2 : d.state === "available" ? 1.0 : 0.6;
        return [d.lat, d.lng, w] as [number, number, number];
      })
      .filter(Boolean) as any;
  }, [data]);

  const fetchZones = async () => {
    try {
      const res = await apiClient.zones.getAll({ isActive: true });
      setZones(res.data.data.zones || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load zones");
    }
  };

  const fetchMap = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedZoneCode !== "ALL") params.zoneCode = selectedZoneCode;
      const res = await apiClient.drivers.getMap(params);
      setData(res.data.data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to load driver map data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    fetchMap();
    const t = setInterval(fetchMap, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZoneCode]);

  const counts = data?.counts || { total: 0, offline: 0, available: 0, busy: 0, on_trip: 0 };
  const center: [number, number] = zonePolygonLatLngs?.[0] || [20.5937, 78.9629];

  const colorFor = (state: DriverState) => {
    switch (state) {
      case "available":
        return "#16a34a";
      case "on_trip":
        return "#2563eb";
      case "busy":
        return "#f97316";
      default:
        return "#64748b";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drivers Map</h1>
          <p className="text-muted-foreground">Live view of online / on-trip drivers + heatmap</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <label className="mr-2">Zone</label>
            <select
              className="border rounded-md px-2 py-1"
              value={selectedZoneCode}
              onChange={(e) => setSelectedZoneCode(e.target.value)}
            >
              <option value="ALL">All</option>
              {zones.map((z) => (
                <option key={z._id} value={z.code}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
            Heatmap
          </label>
          <button className="border rounded-md px-3 py-1 text-sm" onClick={fetchMap} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{counts.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{counts.available}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">On Trip</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">{counts.on_trip}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Busy</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-orange-600">{counts.busy}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-600">{counts.offline}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[70vh] w-full">
            <MapContainer center={center} zoom={selectedZone ? 12 : 5} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {zonePolygonLatLngs && (
                <Polygon pathOptions={{ color: "#0ea5e9", weight: 2 }} positions={zonePolygonLatLngs as any} />
              )}

              {showHeatmap && heatPoints.length > 0 && <HeatLayer points={heatPoints} />}

              {data?.drivers?.map((d) => {
                if (typeof d.lat !== "number" || typeof d.lng !== "number") return null;
                if (d.lat === 0 && d.lng === 0) return null;
                return (
                  <CircleMarker
                    key={d.id}
                    center={[d.lat, d.lng]}
                    radius={6}
                    pathOptions={{ color: colorFor(d.state as DriverState), fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">
                          {d.user?.firstName || "Driver"} {d.user?.lastName || ""}
                        </div>
                        <div>Status: {d.state}</div>
                        <div>Vehicle: {d.vehicleType}</div>
                        <div>Phone: {d.user?.phone || "-"}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


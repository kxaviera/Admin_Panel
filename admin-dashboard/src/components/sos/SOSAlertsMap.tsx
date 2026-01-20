"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

type AnyAlert = any;

function FlyToSelected({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
    default:
      return "#64748b";
  }
}

export function SOSAlertsMap({
  alerts,
  selectedId,
  onSelect,
}: {
  alerts: AnyAlert[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
}) {
  const points = useMemo(() => {
    return (alerts || [])
      .map((a: AnyAlert) => {
        const id = String(a?._id || a?.id || "");
        const coords = a?.location?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) return null;
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { id, lat, lng, alert: a };
      })
      .filter(Boolean) as { id: string; lat: number; lng: number; alert: AnyAlert }[];
  }, [alerts]);

  const selectedPoint = useMemo(() => {
    if (!selectedId) return null;
    return points.find((p) => p.id === selectedId) || null;
  }, [points, selectedId]);

  const center = selectedPoint
    ? { lat: selectedPoint.lat, lng: selectedPoint.lng }
    : points[0]
      ? { lat: points[0].lat, lng: points[0].lng }
      : { lat: 20.5937, lng: 78.9629 }; // default (India)

  const zoom = selectedPoint ? 14 : points.length ? 11 : 4;

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToSelected center={center} zoom={zoom} />

        {points.map((p) => {
          const a = p.alert;
          const color = getPriorityColor(String(a?.priority || "low"));
          const isSelected = selectedId != null && p.id === selectedId;
          const address = a?.location?.address || "-";
          const createdAt = a?.createdAt ? new Date(a.createdAt).toLocaleString() : "-";
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={isSelected ? 12 : 9}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isSelected ? 0.8 : 0.55,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelect?.(p.id),
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{String(a?.reason || "SOS Alert")}</div>
                  <div className="text-sm">
                    <span className="font-medium">Status:</span> {String(a?.status || "-")}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Priority:</span> {String(a?.priority || "-")}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Address:</span> {String(address)}
                  </div>
                  <div className="text-xs text-muted-foreground">{createdAt}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}


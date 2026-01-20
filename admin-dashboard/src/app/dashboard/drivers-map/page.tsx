import dynamic from "next/dynamic";

const DriversMapClient = dynamic(() => import("@/components/maps/drivers-map-client"), {
  ssr: false,
});

export default function DriversMapPage() {
  return <DriversMapClient />;
}


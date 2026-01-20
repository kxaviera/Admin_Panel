"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Car,
  Route,
  CreditCard,
  Calendar,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  Image,
  Package,
  Truck,
  UserCog,
  Building2,
  Car as CarIcon,
  FileText,
  HelpCircle,
  Map,
  Grid,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

const navigationSections = [
  {
    title: "HOME",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "SOS Alerts", href: "/dashboard/sos", icon: AlertTriangle },
      { name: "Chats", href: "/dashboard/chats", icon: MessageSquare },
      { name: "Media", href: "/dashboard/media", icon: Image },
    ],
  },
  {
    title: "SERVICES",
    items: [
      { name: "Rides", href: "/dashboard/rides", icon: Route },
      { name: "Parcels", href: "/dashboard/parcels", icon: Package },
      { name: "Freight", href: "/dashboard/freight", icon: Truck },
    ],
  },
  {
    title: "USER MANAGEMENT",
    items: [
      { name: "Users", href: "/dashboard/users", icon: Users },
      { name: "Drivers", href: "/dashboard/drivers", icon: Car },
      { name: "Driver Applications", href: "/dashboard/driver-applications", icon: FileText },
      { name: "Dispatchers", href: "/dashboard/dispatchers", icon: UserCog },
      { name: "Fleet Managers", href: "/dashboard/fleet-managers", icon: Building2 },
      { name: "Fleet Vehicles", href: "/dashboard/fleet-vehicles", icon: CarIcon },
    ],
  },
  {
    title: "FINANCIAL",
    items: [
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { name: "Subscriptions", href: "/dashboard/subscriptions", icon: Calendar },
      { name: "Promo Codes", href: "/dashboard/promo-codes", icon: Tag },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { name: "Blogs", href: "/dashboard/blogs", icon: FileText },
      { name: "Pages", href: "/dashboard/pages", icon: FileText },
      { name: "FAQs", href: "/dashboard/faqs", icon: HelpCircle },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      { name: "Vehicles", href: "/dashboard/vehicles", icon: Car },
      { name: "Vehicle Pricing", href: "/dashboard/vehicle-pricing", icon: Car },
      { name: "Parcel Vehicles", href: "/dashboard/parcel-vehicles", icon: Package },
      { name: "Parcel Vehicle Pricing", href: "/dashboard/parcel-vehicle-pricing", icon: Package },
      { name: "Zones", href: "/dashboard/zones", icon: Map },
      { name: "Services", href: "/dashboard/services", icon: Grid },
      { name: "Drivers Map", href: "/dashboard/drivers-map", icon: Map },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Pikkar Admin</span>
        </div>
      </div>
      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}


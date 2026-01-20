"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Car, Route, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data: revenueData } = useQuery({
    queryKey: ["analytics-revenue", period],
    queryFn: async () => {
      const response = await apiClient.analytics.getRevenue({ period });
      return response.data.data;
    },
  });

  const { data: ridesData } = useQuery({
    queryKey: ["analytics-rides", period],
    queryFn: async () => {
      const response = await apiClient.analytics.getRides({ period });
      return response.data.data;
    },
  });

  const { data: driverPerformance } = useQuery({
    queryKey: ["analytics-driver-performance"],
    queryFn: async () => {
      const response = await apiClient.analytics.getDriverPerformance();
      return response.data.data;
    },
  });

  const { data: marketingData } = useQuery({
    queryKey: ["analytics-marketing"],
    queryFn: async () => {
      const response = await apiClient.analytics.getMarketing();
      return response.data.data;
    },
  });

  const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Detailed insights and reports</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData?.total || 0)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +{revenueData?.growth || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Rides
            </CardTitle>
            <Route className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridesData?.total || 0}</div>
            <p className="text-xs text-green-600 mt-1">
              +{ridesData?.growth || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
            <Users className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridesData?.activeUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Unique users this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Drivers
            </CardTitle>
            <Car className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridesData?.activeDrivers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Drivers who completed rides</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="subscription"
                  stroke="#16a34a"
                  name="Subscription Revenue"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rides by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ridesData?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(ridesData?.byStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ridesData?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#16a34a" name="Completed" />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(driverPerformance?.topDrivers || []).slice(0, 5).map((driver: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-gray-500">
                        {driver.totalRides} rides • {driver.rating?.toFixed(1)}★
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(driver.totalEarnings)}</p>
                    <p className="text-xs text-gray-500">Earnings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Promo Code Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Promo Codes</span>
                <span className="font-semibold">{marketingData?.promoCodes?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-green-600">
                  {marketingData?.promoCodes?.active || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Uses</span>
                <span className="font-semibold">{marketingData?.promoCodes?.totalUses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount Given</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(marketingData?.promoCodes?.totalDiscount || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Referrals</span>
                <span className="font-semibold">{marketingData?.referrals?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Successful</span>
                <span className="font-semibold text-green-600">
                  {marketingData?.referrals?.successful || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">
                  {marketingData?.referrals?.conversionRate || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rewards Paid</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(marketingData?.referrals?.totalRewards || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Subscriptions</span>
                <span className="font-semibold text-green-600">
                  {marketingData?.subscriptions?.active || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Revenue</span>
                <span className="font-semibold">
                  {formatCurrency(marketingData?.subscriptions?.monthlyRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Renewal Rate</span>
                <span className="font-semibold">
                  {marketingData?.subscriptions?.renewalRate || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className="font-semibold text-red-600">
                  {marketingData?.subscriptions?.churnRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


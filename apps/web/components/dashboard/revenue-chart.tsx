"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useQuery } from "@tanstack/react-query";
import { getRevenueAnalytics } from "@/lib/api/dashboard/dashboard";

type Props = {
  organizationId: string;
};

export function RevenueChart({
  organizationId,
}: Props) {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "revenue",
      organizationId,
    ],

    queryFn: () =>
      getRevenueAnalytics(
        organizationId
      ),

    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          Loading revenue...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Failed to load revenue.
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: "Today",
      value: data?.today ?? 0,
    },
    {
      name: "This Week",
      value: data?.thisWeek ?? 0,
    },
    {
      name: "This Month",
      value: data?.thisMonth ?? 0,
    },
    {
      name: "All Time",
      value: data?.allTime ?? 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
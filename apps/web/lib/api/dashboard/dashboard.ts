import { api } from "../client";


import { DashboardResponse } from "@/types/dashboard";


export async function getDashboard(
  organizationId:string
): Promise<DashboardResponse> {

  const response = await api.get(
    `/dashboard/${organizationId}`
  );

  return response.data;
}

export async function getRevenueAnalytics(
  organizationId: string
) {

  const response = await api.get(
    `/dashboard/${organizationId}/revenue`
  );

  return response.data;
}
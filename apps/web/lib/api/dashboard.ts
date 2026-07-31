import { api } from "./client";

export async function getDashboard(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}`
  );

  return response.data;
}


export async function getRecentRegistrations(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/recent-registrations`
  );

  return response.data;
}


export async function getAttendance(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/attendance`
  );

  return response.data;
}


export async function getRevenue(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/revenue`
  );

  return response.data;
}


export async function getEventPerformance(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/event-performance`
  );

  return response.data;
}


export async function getTicketSales(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/ticket-sales`
  );

  return response.data;
}


export async function getPaymentAnalytics(
  organizationId: string
) {
  const response = await api.get(
    `/dashboard/${organizationId}/payments`
  );

  return response.data;
}
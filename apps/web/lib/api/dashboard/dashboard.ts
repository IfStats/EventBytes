import { api } from "../client";


export async function getDashboard(
  organizationId: string
) {

  const response = await api.get(
    `/dashboard/${organizationId}`
  );

  return response.data;
}
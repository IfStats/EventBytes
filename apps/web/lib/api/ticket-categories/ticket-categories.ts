import { api } from "@/lib/api/client";

export async function getTicketCategories(
  eventId: string,
) {
  const response = await api.get(
    `/ticket-categories/${eventId}`,
  );

  return response.data;
}

export async function createTicketCategory(
  organizationId: string,
  eventId: string,
  data: {
    name: string;
    price: number;
    quantity: number;
  },
) {
  const response = await api.post(
    `/ticket-categories/${organizationId}/${eventId}`,
    data,
  );

  return response.data;
}

export async function deleteTicketCategory(
  id: string,
) {
  const response = await api.delete(
    `/ticket-categories/${id}`,
  );

  return response.data;
}
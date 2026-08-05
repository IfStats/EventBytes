import { api } from "@/lib/api/client";


export async function getEvents(
  organizationId: string
) {

  const response =
    await api.get(
      `/events/${organizationId}`
    );

  return response.data;

}



export async function createEvent(
  organizationId: string,
  data: {
    name:string;
    description?:string;
    venue?:string;
    startDate:string;
    endDate:string;
  }
) {

  const response =
    await api.post(
      `/events/${organizationId}`,
      data
    );

  return response.data;

}



export async function publishEvent(
  organizationId:string,
  eventId:string
){

 const response =
 await api.patch(
 `/events/${organizationId}/${eventId}/publish`
 );

 return response.data;

}
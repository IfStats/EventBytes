"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/auth-context";

import {
  getTicketCategories,
  deleteTicketCategory,
} from "@/lib/api/ticket-categories/ticket-categories";

import {
  publishEvent,
} from "@/lib/api/events/events";

export default function TicketCategoriesPage() {

  const params = useParams();
  const eventId = params.eventId as string;

  const { organizationId } = useAuth();

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket-categories", eventId],
    queryFn: () => getTicketCategories(eventId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicketCategory,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-categories", eventId],
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      publishEvent(
        organizationId!,
        eventId,
      ),

    onSuccess: () => {
      alert("Event published successfully.");
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading ticket categories...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Failed loading ticket categories.
      </div>
    );
  }

  return (
    <div className="p-8">

      <div className="flex justify-between mb-6">

        <h1 className="text-3xl font-bold">
          Ticket Categories
        </h1>

        <div className="flex gap-3">

          <Button
            onClick={() =>
              publishMutation.mutate()
            }
          >
            Publish Event
          </Button>

          <Link
            href={`/dashboard/events/${eventId}/tickets/new`}
          >
            <Button>
              New Ticket Category
            </Button>
          </Link>

        </div>

      </div>

      <div className="grid gap-5">

        {data?.map((ticket: any) => (

          <Card key={ticket.id}>

            <CardHeader>

              <CardTitle>
                {ticket.name}
              </CardTitle>

            </CardHeader>

            <CardContent>

              <p>Price: ₦{ticket.price}</p>

              <p>Quantity: {ticket.quantity}</p>

              <p>Sold: {ticket.sold}</p>

              <Button
                variant="destructive"
                className="mt-4"
                onClick={() =>
                  deleteMutation.mutate(ticket.id)
                }
              >
                Delete
              </Button>

            </CardContent>

          </Card>

        ))}

      </div>

    </div>
  );
}
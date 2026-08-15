"use client";

import { useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/context/auth-context";

import {
  createTicketCategory,
} from "@/lib/api/ticket-categories/ticket-categories";

export default function CreateTicketCategoryPage() {

  const router = useRouter();

  const params = useParams();

  const eventId = params.eventId as string;

  const { organizationId } = useAuth();

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
  });

  const mutation = useMutation({

    mutationFn: () =>

      createTicketCategory(
        organizationId!,
        eventId,
        {
          name: form.name,
          price: Number(form.price),
          quantity: Number(form.quantity),
        }
      ),

    onSuccess: () => {

      router.push(
        `/dashboard/events/${eventId}/tickets`
      );

    },

  });

  function update(field: string, value: string) {

    setForm({
      ...form,
      [field]: value,
    });

  }

  return (

    <div className="p-8">

      <Card className="max-w-lg">

        <CardHeader>

          <CardTitle>

            Create Ticket Category

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Ticket Name"
            value={form.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
          />

          <Input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              update("price", e.target.value)
            }
          />

          <Input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              update("quantity", e.target.value)
            }
          />

          <Button
            className="w-full"
            disabled={
              mutation.isPending ||
              !organizationId
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Creating..."
              : "Create Ticket Category"}
          </Button>

          {mutation.error && (
            <p className="text-red-500 text-sm">
              Failed creating ticket category.
            </p>
          )}

        </CardContent>

      </Card>

    </div>

  );

}
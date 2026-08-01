"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CalendarDays,
  Users,
  Ticket,
  DollarSign,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/dashboard/dashboard";
import { useAuth } from "@/context/auth-context";
import { RevenueChart } from "@/components/dashboard/revenue-chart";


export default function DashboardPage() {

  const {
  organizationId,
  isLoading: userLoading,
} = useAuth();

  const {
  data,
  isLoading,
  error,
} = useQuery({
  queryKey: [
    "dashboard",
    organizationId,
  ],

  queryFn: () => {
    if (!organizationId) {
      throw new Error("Organization ID missing");
    }

    return getDashboard(organizationId);
  },

  enabled: !!organizationId,

  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});


  if (isLoading || userLoading) {
    return (
      <div className="p-8">
        Loading dashboard...
      </div>
    );
  }


  if (error) {
  return (
    <div className="p-8 text-red-500">
      Failed to load dashboard. Please refresh.
    </div>
  );
}

if (!data) {
  return (
    <div className="p-8">
      No dashboard data available.
    </div>
  );
}


  const stats = [
  {
    title: "Total Events",
    value: data?.summary?.totalEvents ?? 0,
    icon: CalendarDays,
  },

  {
    title: "Published Events",
    value: data?.summary?.publishedEvents ?? 0,
    icon: CalendarDays,
  },

  {
    title: "Registrations",
    value: data?.summary?.totalRegistrations ?? 0,
    icon: Users,
  },

  {
    title: "Tickets Sold",
    value: data?.summary?.ticketsSold ?? 0,
    icon: Ticket,
  },

  {
    title: "Revenue",
    value: data?.summary?.revenue ?? 0,
    icon: DollarSign,
  },

  {
    title: "Checked In",
    value: data?.summary?.checkedIn ?? 0,
    icon: Users,
  },

  {
    title: "Pending Payments",
    value: data?.summary?.pendingPayments ?? 0,
    icon: DollarSign,
  },

  {
    title: "Upcoming Events",
    value: data?.summary?.upcomingEvents ?? 0,
    icon: CalendarDays,
  },
];

<div className="mt-8">
  {organizationId && (
    <RevenueChart
      organizationId={organizationId}
    />
  )}
</div>

  return (
    <main className="min-h-screen bg-muted/40 p-8">


      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          EventBytes Dashboard
        </h1>

        <p className="text-muted-foreground">
          Manage your events, attendees and revenue.
        </p>

      </div>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (

            <Card key={stat.title}>

              <CardHeader className="flex flex-row items-center justify-between">

                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>

                <Icon className="h-5 w-5 text-muted-foreground" />

              </CardHeader>


              <CardContent>

  <div className="text-3xl font-bold">
    {stat.title === "Revenue"
  ? `$${Number(stat.value).toLocaleString()}`
  : Number(stat.value).toLocaleString()
}
  </div>

  <p className="text-xs text-muted-foreground mt-2">
    Current total
  </p>

</CardContent>

            </Card>

          );

        })}

      </div>


      <div className="mt-8 grid gap-6 lg:grid-cols-2">


        <Card>

          <CardHeader>
            <CardTitle>
              Recent Registrations
            </CardTitle>
          </CardHeader>


          <CardContent>

            {data?.recentRegistrations?.length
              ? data.recentRegistrations.map(
                  (registration) => (
                    <div
                      key={registration.id}
                      className="border-b py-3"
                    >
                      <p className="font-medium">
                        {registration.attendee}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {registration.event}
                      </p>

                    </div>
                  )
                )
              : "No registrations yet"
            }

          </CardContent>

        </Card>



        <Card>

          <CardHeader>

            <CardTitle>
              Recent Events
            </CardTitle>

          </CardHeader>


          <CardContent>

            {data?.recentEvents?.length
              ? data.recentEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="border-b py-3"
                    >
                      <p className="font-medium">
                        {event.name}
                      </p>
                    </div>
                  )
                )
              : "No events yet"
            }

          </CardContent>

        </Card>


      </div>


    </main>
  );
}
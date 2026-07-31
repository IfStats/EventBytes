import StatCard from "@/components/dashboard/stat-card";
import EventsTable from "@/components/dashboard/events-table";

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Events"
          value="12"
          description="Created events"
        />

        <StatCard
          title="Tickets Sold"
          value="4,850"
          description="Across all events"
        />

        <StatCard
          title="Revenue"
          value="₵245,000"
          description="Total earnings"
        />

        <StatCard
          title="Registrations"
          value="5,200"
          description="Attendees"
        />
      </div>


      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Recent Events
        </h2>

        <EventsTable />
      </div>

    </div>
  );
}
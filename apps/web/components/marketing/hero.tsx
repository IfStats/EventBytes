import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center">
      <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-6xl">
        Create unforgettable events.
        <br />
        Sell tickets. Manage attendees.
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        EventBytes gives organizers the tools to create events,
        manage registrations, accept payments, and deliver seamless
        attendee experiences.
      </p>

      <div className="mt-8 flex gap-4">
        <Button size="lg">
          Create an Event
        </Button>

        <Button
          size="lg"
          variant="outline"
        >
          Explore Events
        </Button>
      </div>
    </section>
  );
}
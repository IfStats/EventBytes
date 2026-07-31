import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Event Management",
    description:
      "Create and manage events with powerful organizer tools.",
  },
  {
    title: "Ticket Sales",
    description:
      "Sell tickets and manage different ticket categories.",
  },
  {
    title: "QR Check-in",
    description:
      "Fast attendee verification with digital tickets.",
  },
  {
    title: "Payments",
    description:
      "Accept secure payments through supported providers.",
  },
];

export default function Features() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-4">
      {features.map((feature) => (
        <Card key={feature.title}>
          <CardHeader>
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
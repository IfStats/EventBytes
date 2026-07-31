import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

const events = [
  {
    name: "EventBytes Launch Conference",
    date: "Dec 01, 2026",
    tickets: 500,
    status: "Active",
  },
  {
    name: "Africa Tech Summit",
    date: "Jan 20, 2027",
    tickets: 2000,
    status: "Draft",
  },
];

export default function EventsTable() {
  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Tickets</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {events.map((event) => (
            <TableRow key={event.name}>
              <TableCell className="font-medium">
                {event.name}
              </TableCell>

              <TableCell>
                {event.date}
              </TableCell>

              <TableCell>
                {event.tickets}
              </TableCell>

              <TableCell>
                <Badge>
                  {event.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
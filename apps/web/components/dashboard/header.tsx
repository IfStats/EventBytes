import {
  Bell,
  ChevronDown,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div>
        <h1 className="text-lg font-semibold">
          Organizer Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage your events, tickets, and attendees
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
        >
          <Bell size={18} />
        </Button>

        <Button
          variant="ghost"
          className="flex items-center gap-2"
        >
          <Avatar>
            <AvatarFallback>
              JA
            </AvatarFallback>
          </Avatar>

          <span className="hidden md:block">
            Joshua
          </span>

          <ChevronDown size={16} />
        </Button>
      </div>
    </header>
  );
}
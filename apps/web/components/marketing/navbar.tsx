import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          EventBytes
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/events"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Explore Events
          </Link>

          <Link
            href="/organizer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Organize
          </Link>

          <Button>
            Create Event
          </Button>
        </nav>
      </div>
    </header>
  );
}
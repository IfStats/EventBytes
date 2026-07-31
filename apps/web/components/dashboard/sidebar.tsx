import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    name: "Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
  {
    name: "Registrations",
    href: "/dashboard/registrations",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-background p-6 md:block">
      <div className="mb-8 text-xl font-bold">
        EventBytes
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
export interface DashboardSummary {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  ticketsSold: number;
  checkedIn: number;
  pendingPayments: number;
  revenue: number;
  upcomingEvents: number;
}


export interface RecentEvent {
  id: string;
  name: string;
  createdAt: string;
}


export interface RecentRegistration {
  id: string;
  attendee: string;
  email: string;
  event: string;
  ticketType: string;
  status: string;
  registeredAt: string;
}


export interface DashboardResponse {
  summary: DashboardSummary;
  recentEvents: RecentEvent[];
  recentRegistrations: RecentRegistration[];
}
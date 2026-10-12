
import { Controller } from "@nestjs/common";

@Controller("tickets")
export class TicketsController {
  // Direct public ticket issuance is disabled.
  // Payment verification issues tickets internally
  // within an authenticated, verified payment flow.
  //
  // Check-in endpoints will be restored with
  // organizer membership and role authorization.
}

import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
	constructor(
		private readonly dashboardService: DashboardService,
	) {}

	@Get(':organizationId')
getDashboard(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getDashboard(
    organizationId,
  );
}

@Get(':organizationId/recent-registrations')
getRecentRegistrations(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getRecentRegistrations(
    organizationId,
  );
}
}

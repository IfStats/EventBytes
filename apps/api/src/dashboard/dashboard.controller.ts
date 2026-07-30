import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { DashboardService } from './dashboard.service';
import { OrganizationGuard } from '../common/guards/organization.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(
  AuthGuard('jwt'),
  OrganizationGuard,
)
export class DashboardController {

  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get(':organizationId')
  @Roles('OWNER', 'ADMIN')
  getDashboard(
    @Param('organizationId') organizationId: string,
  ) {
    return this.dashboardService.getDashboard(
      organizationId,
    );
  }

  @Get(':organizationId/recent-registrations')
  @Roles('OWNER', 'ADMIN')
  getRecentRegistrations(
    @Param('organizationId') organizationId: string,
  ) {
    return this.dashboardService.getRecentRegistrations(
      organizationId,
    );
  }

  @Get(':organizationId/attendance')
  @Roles('OWNER', 'ADMIN')
  getAttendance(
    @Param('organizationId') organizationId: string,
  ) {
    return this.dashboardService.getAttendanceSummary(
      organizationId,
    );
  }

  @Get(':organizationId/revenue')
getRevenue(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getRevenueAnalytics(
    organizationId,
  );
}

@Get(':organizationId/event-performance')
getEventPerformance(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getEventPerformance(
    organizationId,
  );
}

@Get(':organizationId/ticket-sales')
getTicketSales(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getTicketSales(
    organizationId,
  );
}

@Get(':organizationId/payments')
getPaymentAnalytics(
  @Param('organizationId') organizationId: string,
) {
  return this.dashboardService.getPaymentAnalytics(
    organizationId,
  );
}
}
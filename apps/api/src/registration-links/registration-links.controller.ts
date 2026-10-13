import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RegistrationLinksService } from './registration-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../common/guards/organization.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('registration-links')
export class RegistrationLinksController {
  constructor(private readonly service: RegistrationLinksService) {}

  // Public link lookup.
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // Attendees must authenticate to register.
  @Post(':slug/register')
  @UseGuards(JwtAuthGuard)
  register(
    @Param('slug') slug: string,
    @Body()
    body: {
      ticketCategoryId: string;
    },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.registerFromLink(
      slug,
      req.user.id,
      body.ticketCategoryId,
    );
  }

  // Only organization owners/admins create links.
  @Post('organizations/:organizationId/events/:eventId')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @Roles('OWNER', 'ADMIN')
  create(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.create(organizationId, eventId);
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TicketCategoriesService } from './ticket-categories.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { OrganizationGuard } from '../common/guards/organization.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ticket-categories')
export class TicketCategoriesController {
  constructor(private readonly service: TicketCategoriesService) {}

  @Post(':organizationId/:eventId')
  @UseGuards(AuthGuard('jwt'), OrganizationGuard)
  @Roles('OWNER', 'ADMIN')
  create(
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketCategoryDto,
  ) {
    return this.service.create(organizationId, eventId, dto);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId') eventId: string) {
    return this.service.findByEvent(eventId);
  }

  @Delete(':organizationId/:id')
  @UseGuards(AuthGuard('jwt'), OrganizationGuard)
  @Roles('OWNER', 'ADMIN')
  delete(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.delete(organizationId, id);
  }
}

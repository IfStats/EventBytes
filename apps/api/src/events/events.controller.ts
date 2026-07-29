import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Patch
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { OrganizationGuard } from '../common/guards/organization.guard';
import { Roles } from '../common/decorators/roles.decorator';


@Controller('events')
export class EventsController {

  constructor(
    private service: EventsService
  ) {}


  // -------------------------
  // PUBLIC ROUTES
  // -------------------------

  @Get()
  findPublishedEvents() {

    return this.service.findPublishedEvents();

  }


  @Get('public/:slug')
  findEventBySlug(
    @Param('slug') slug:string,
  ) {

    return this.service.findEventBySlug(slug);

  }


  // -------------------------
  // ORGANIZER ROUTES
  // -------------------------


  @Post(':organizationId')
  @UseGuards(
    AuthGuard('jwt'),
    OrganizationGuard
  )
  @Roles('OWNER','ADMIN')
  create(
    @Param('organizationId') organizationId:string,
    @Body() dto:CreateEventDto,
  ) {

    return this.service.create(
      organizationId,
      dto
    );

  }



  @Patch(':organizationId/:eventId/publish')
  @UseGuards(
    AuthGuard('jwt'),
    OrganizationGuard
  )
  @Roles('OWNER','ADMIN')
  togglePublish(
    @Param('organizationId') organizationId:string,
    @Param('eventId') eventId:string,
  ) {

    return this.service.togglePublish(
      organizationId,
      eventId
    );

  }


  @Get(':eventId/attendees')
  @UseGuards(
    AuthGuard('jwt'),
    OrganizationGuard
  )
  @Roles('OWNER','ADMIN')
  getAttendees(
    @Param('eventId') eventId:string,
  ) {

    return this.service.getAttendees(
      eventId
    );

  }



  @Get(':organizationId')
  @UseGuards(
    AuthGuard('jwt'),
    OrganizationGuard
  )
  @Roles('OWNER','ADMIN')
  findAll(
    @Param('organizationId') organizationId:string,
  ) {

    return this.service.findAll(
      organizationId
    );

  }

}
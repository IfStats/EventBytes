import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards
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
  ){}


  @Post(':organizationId')
  @UseGuards(
    AuthGuard('jwt'),
    OrganizationGuard
  )
  @Roles('OWNER','ADMIN')
  create(
    @Param('organizationId') organizationId:string,
    @Body() dto:CreateEventDto
  ){

    return this.service.create(
      organizationId,
      dto
    );

  }


  // IMPORTANT: keep this ABOVE :organizationId
  @Get(':eventId/attendees')
  getAttendees(
    @Param('eventId') eventId:string,
  ){

    return this.service.getAttendees(eventId);

  }


  @Get(':organizationId')
  findAll(
    @Param('organizationId') organizationId:string
  ){

    return this.service.findAll(
      organizationId
    );

  }

}
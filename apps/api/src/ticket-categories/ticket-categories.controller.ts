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

import { TicketCategoriesService }
from './ticket-categories.service';

import { CreateTicketCategoryDto }
from './dto/create-ticket-category.dto';

import { OrganizationGuard }
from '../common/guards/organization.guard';

import { Roles }
from '../common/decorators/roles.decorator';


@Controller('ticket-categories')
export class TicketCategoriesController {


constructor(
  private service: TicketCategoriesService,
){}



// CREATE TICKET CATEGORY

@Post(':organizationId/:eventId')
@UseGuards(
  AuthGuard('jwt'),
  OrganizationGuard
)
@Roles(
  'OWNER',
  'ADMIN'
)
create(

  @Param('organizationId')
  organizationId:string,

  @Param('eventId')
  eventId:string,

  @Body()
  dto:CreateTicketCategoryDto,

){

  return this.service.create(
    eventId,
    dto
  );

}




// GET EVENT TICKETS

@Get('event/:eventId')
findByEvent(

  @Param('eventId')
  eventId:string,

){

  return this.service.findByEvent(
    eventId
  );

}




// DELETE CATEGORY

@Delete(':id')
@UseGuards(
  AuthGuard('jwt')
)
delete(

  @Param('id')
  id:string,

){

  return this.service.delete(
    id
  );

}


}
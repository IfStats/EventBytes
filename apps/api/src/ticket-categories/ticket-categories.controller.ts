import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { TicketCategoriesService } from './ticket-categories.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';

@Controller()
export class TicketCategoriesController {
  constructor(
    private readonly ticketCategoriesService: TicketCategoriesService,
  ) {}

  @Post('events/:eventId/ticket-categories')
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketCategoryDto,
  ) {
    return this.ticketCategoriesService.create(eventId, dto);
  }

  @Get('events/:eventId/ticket-categories')
  findAll(
    @Param('eventId') eventId: string,
  ) {
    return this.ticketCategoriesService.findAll(eventId);
  }

  @Get('ticket-categories/:id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.ticketCategoriesService.findOne(id);
  }
}
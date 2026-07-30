import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { RegistrationLinksService } from './registration-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@Controller('registration-links')
export class RegistrationLinksController {

  constructor(
    private service: RegistrationLinksService,
  ) {}



  @Post(':eventId')
  create(
    @Param('eventId') eventId: string,
  ) {

    return this.service.create(
      eventId,
    );

  }



  @Get(':slug')
  findBySlug(
    @Param('slug') slug: string,
  ) {

    return this.service.findBySlug(
      slug,
    );

  }



  @Post(':slug/register')
  @UseGuards(JwtAuthGuard)
  register(
    @Param('slug') slug: string,

    @Body() body: {
      ticketCategoryId: string;
    },

    @Req() req,
  ) {

    return this.service.registerFromLink(
      slug,
      req.user.id,
      body.ticketCategoryId,
    );

  }


}
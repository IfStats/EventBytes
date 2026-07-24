import {
 Controller,
 Post,
 Body,
 Req,
 Get,
 UseGuards
} from '@nestjs/common';

import { RegistrationsService } 
from './registrations.service';

import { CreateRegistrationDto }
from './dto/create-registration.dto';

import { JwtAuthGuard }
from '../auth/guards/jwt-auth.guard';

@Controller('registrations')
export class RegistrationsController {

constructor(
 private registrationsService: RegistrationsService
){}

@Post()
@UseGuards(JwtAuthGuard)
create(
  @Req() req,
  @Body() dto: CreateRegistrationDto,
) {
  return this.registrationsService.create(
    req.user.id,
    dto,
  );
}

@Get()
@UseGuards(JwtAuthGuard)
async findMine(
  @Req() req
) {
  return this.registrationsService.findUserRegistrations(req.user.id);
}

}

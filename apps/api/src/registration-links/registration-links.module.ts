import { Module } from '@nestjs/common';

import { RegistrationLinksService } from './registration-links.service';
import { RegistrationLinksController } from './registration-links.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';


@Module({

  imports: [
    PrismaModule,
    PaymentsModule,
  ],

  providers: [
    RegistrationLinksService,
  ],

  controllers: [
    RegistrationLinksController,
  ],

  exports: [
    RegistrationLinksService,
  ],

})

export class RegistrationLinksModule {}
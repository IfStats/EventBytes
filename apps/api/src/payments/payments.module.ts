import { Module } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { TicketsModule } from '../tickets/tickets.module';
import { MailModule } from '../mail/mail.module';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';


@Module({

  imports: [
    PrismaModule,
    TicketsModule,
    MailModule,
    HttpModule,
    ConfigModule,
  ],

  providers: [
    PaymentsService,
  ],

  controllers: [
    PaymentsController,
  ],

  exports: [
    PaymentsService,
  ],

})

export class PaymentsModule {}
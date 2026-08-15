import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { TicketCategoriesModule } from './ticket-categories/ticket-categories.module';
import { ConfigModule } from '@nestjs/config';
import { OrganizationsModule } from './organizations/organizations.module';
import { TicketsModule } from './tickets/tickets.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RegistrationLinksModule } from './registration-links/registration-links.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EventsModule,
    TicketCategoriesModule,
    DashboardModule,
    OrganizationsModule,
    TicketsModule,
    RegistrationsModule,
    PaymentsModule,
    MailModule,
    
    RegistrationLinksModule,
  ],
})
export class AppModule {}
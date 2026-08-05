import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TicketCategoriesModule } from './ticket-categories/ticket-categories.module';
import { RegistrationLinksModule } from './registration-links/registration-links.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    EventsModule,
    TicketsModule,
    RegistrationsModule,
    PaymentsModule,
    MailModule,
    DashboardModule,
    TicketCategoriesModule,
    RegistrationLinksModule,
  ],
})
export class AppModule {}
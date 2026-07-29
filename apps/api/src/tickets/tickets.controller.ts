import { Body, Controller, Post, Param } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {

	constructor(
		private readonly ticketsService: TicketsService
	) {}


	@Post('issue/:registrationId')
	issueTicket(
		@Param('registrationId') registrationId: string
	) {

		return this.ticketsService.issueTicket(
			registrationId
		);

	}


	@Post('checkin')
	checkIn(
		@Body() body: {
			ticketNumber: string;
			checkedInBy?: string;
		}
	) {

		return this.ticketsService.checkIn(
			body.ticketNumber,
			body.checkedInBy
		);

	}

}
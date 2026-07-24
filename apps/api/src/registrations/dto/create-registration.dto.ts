import { IsString } from 'class-validator';

export class CreateRegistrationDto {

  @IsString()
  eventId: string;

  @IsString()
  ticketTypeId: string;

}

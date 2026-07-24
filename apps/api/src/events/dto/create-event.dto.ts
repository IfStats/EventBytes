import {
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateEventDto {

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

}

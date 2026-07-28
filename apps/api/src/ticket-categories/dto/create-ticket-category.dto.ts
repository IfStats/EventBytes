import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateTicketCategoryDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
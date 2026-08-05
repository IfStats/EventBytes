import {
  IsString,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';


export class CreateTicketCategoryDto {

  @IsString()
  name:string;


  @IsNumber()
  @Min(0)
  price:number;


  @IsInt()
  @Min(1)
  quantity:number;

}
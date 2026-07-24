import {
 IsString,
 IsNumber,
 IsInt
} from 'class-validator';

export class CreateTicketDto {

@IsString()
name:string;

@IsNumber()
price:number;

@IsInt()
quantity:number;

}

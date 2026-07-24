import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {

constructor(
 private prisma: PrismaService
){}

create(
 organizationId:string,
 dto:CreateEventDto
){

return this.prisma.event.create({

data:{
 organizationId,
 name:dto.name,
 description:dto.description,
 venue:dto.venue,
 startDate:new Date(dto.startDate),
 endDate:new Date(dto.endDate)
}

});

}

findAll(organizationId:string){

return this.prisma.event.findMany({

where:{
organizationId
},

include:{
ticketCategories:true
}

});

}

}

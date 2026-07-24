import {
CanActivate,
ExecutionContext,
Injectable,
ForbiddenException
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationGuard
implements CanActivate {

constructor(
private prisma:PrismaService,
private reflector:Reflector
){}

async canActivate(
context:ExecutionContext
){

const request =
context.switchToHttp()
.getRequest();

const user=request.user;

if(!user){
 throw new ForbiddenException();
}

const organizationId =
request.params.organizationId;

const membership =
await this.prisma.membership.findUnique({

where:{
 userId_organizationId:{
 userId:user.id,
 organizationId
 }
}

});

if(!membership){

throw new ForbiddenException(
'You are not a member of this organization'
);

}

const allowedRoles =
this.reflector.get<string[]>(
'roles',
context.getHandler()
);

if(
allowedRoles &&
!allowedRoles.includes(
membership.role
)
){

throw new ForbiddenException(
'Insufficient permissions'
);

}

request.membership=membership;

return true;

}

}

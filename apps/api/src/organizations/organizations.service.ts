import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
	constructor(
		private readonly prisma: PrismaService,
	) {}

	async create(
		userId: string,
		dto: CreateOrganizationDto,
	) {

		const slug = dto.name
			.toLowerCase()
			.replace(/\s+/g, '-');

		const organization =
			await this.prisma.organization.create({
				data: {
					name: dto.name,
					slug,

					members: {
						create: {
							userId,
							role: 'OWNER',
						},
					},
				},

				include: {
					members: true,
				},
			});

		return organization;
	}
}

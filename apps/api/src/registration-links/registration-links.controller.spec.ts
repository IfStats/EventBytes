import { GUARDS_METADATA } from '@nestjs/common/constants';

import { RegistrationLinksController } from './registration-links.controller';
import { RegistrationLinksService } from './registration-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../common/guards/organization.guard';

describe('RegistrationLinksController authorization', () => {
  const serviceMock = {
    create: jest.fn(),
  };

  const controller = new RegistrationLinksController(
    serviceMock as unknown as RegistrationLinksService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('requires JWT and organization authorization to create links', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      RegistrationLinksController.prototype.create,
    );

    expect(guards).toEqual([JwtAuthGuard, OrganizationGuard]);

    const roles = Reflect.getMetadata(
      'roles',
      RegistrationLinksController.prototype.create,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('passes organization and event IDs to the service', async () => {
    serviceMock.create.mockResolvedValue({
      id: 'link_1',
    });

    await controller.create('org_1', 'event_1');

    expect(serviceMock.create).toHaveBeenCalledWith('org_1', 'event_1');
  });
});

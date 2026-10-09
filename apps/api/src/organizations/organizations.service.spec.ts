
import { Test, TestingModule } from "@nestjs/testing";

import { OrganizationsService } from "./organizations.service";
import { PrismaService } from "../prisma/prisma.service";

describe("OrganizationsService", () => {
  let service: OrganizationsService;

  const prismaMock = {
    organization: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          OrganizationsService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<OrganizationsService>(
      OrganizationsService
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("creates an organization with its owner", async () => {
    const organization = {
      id: "org_1",
      name: "EventBytes Ghana",
      slug: "eventbytes-ghana",
    };

    prismaMock.organization.create.mockResolvedValue(
      organization
    );

    const result = await service.create("user_1", {
      name: "EventBytes Ghana",
    });

    expect(result).toEqual(organization);

    expect(
      prismaMock.organization.create
    ).toHaveBeenCalledWith({
      data: {
        name: "EventBytes Ghana",
        slug: "eventbytes-ghana",
        members: {
          create: {
            userId: "user_1",
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });
  });
});

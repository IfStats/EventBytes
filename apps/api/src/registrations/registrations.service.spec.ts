import { Test, TestingModule } from "@nestjs/testing";
import { RegistrationsService } from "./registrations.service";
import { PrismaService } from "../prisma/prisma.service";

describe("RegistrationsService", () => {
  let service: RegistrationsService;

  const prismaMock = {
    registration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ticketCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          RegistrationsService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get(RegistrationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("filters registrations by user ID", async () => {
    prismaMock.registration.findMany.mockResolvedValue([]);

    const result = await service.findUserRegistrations(
      "user_1",
    );

    expect(result).toEqual([]);

    expect(
      prismaMock.registration.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
        },
      }),
    );
  });
});

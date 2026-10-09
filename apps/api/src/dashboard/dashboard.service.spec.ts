
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardService } from "./dashboard.service";
import { PrismaService } from "../prisma/prisma.service";

describe("DashboardService", () => {
  let service: DashboardService;

  const prismaMock = {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    registration: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
    },
    ticketCategory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          DashboardService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get(DashboardService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("retrieves recent events for the organization", async () => {
    prismaMock.event.findMany.mockResolvedValue([]);

    const result = await service.getRecentEvents(
      "org_1",
    );

    expect(result).toEqual([]);

    expect(
      prismaMock.event.findMany,
    ).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        ticketCategories: true,
        registrations: true,
      },
    });
  });
});

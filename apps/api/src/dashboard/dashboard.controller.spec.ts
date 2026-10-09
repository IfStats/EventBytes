
import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { OrganizationGuard } from "../common/guards/organization.guard";

describe("DashboardController", () => {
  let controller: DashboardController;

  const dashboardServiceMock = {
    getDashboard: jest.fn(),
    getRecentRegistrations: jest.fn(),
    getAttendanceSummary: jest.fn(),
    getRevenueAnalytics: jest.fn(),
    getEventPerformance: jest.fn(),
    getTicketSales: jest.fn(),
    getPaymentAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [DashboardController],
        providers: [
          {
            provide: DashboardService,
            useValue: dashboardServiceMock,
          },
        ],
      })
        .overrideGuard(OrganizationGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

    controller = module.get(DashboardController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("retrieves the dashboard for an organization", async () => {
    const expected = {
      summary: {
        totalEvents: 3,
      },
    };

    dashboardServiceMock.getDashboard.mockResolvedValue(
      expected,
    );

    await expect(
      controller.getDashboard("org_1"),
    ).resolves.toEqual(expected);

    expect(
      dashboardServiceMock.getDashboard,
    ).toHaveBeenCalledWith("org_1");
  });
});

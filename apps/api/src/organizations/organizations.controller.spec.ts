import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsController", () => {
  let controller: OrganizationsController;

  const organizationsServiceMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [OrganizationsController],
        providers: [
          {
            provide: OrganizationsService,
            useValue: organizationsServiceMock,
          },
        ],
      }).compile();

    controller = module.get(OrganizationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("passes the authenticated user to the service", async () => {
    const user = { id: "user_1" };
    const dto = { name: "EventBytes Ghana" };

    const expected = {
      id: "org_1",
      name: dto.name,
    };

    organizationsServiceMock.create.mockResolvedValue(
      expected,
    );

    await expect(
      controller.create(user, dto),
    ).resolves.toEqual(expected);

    expect(
      organizationsServiceMock.create,
    ).toHaveBeenCalledWith("user_1", dto);
  });
});

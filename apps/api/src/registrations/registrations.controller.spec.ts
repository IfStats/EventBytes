import { Test, TestingModule } from "@nestjs/testing";
import { RegistrationsController } from "./registrations.controller";
import { RegistrationsService } from "./registrations.service";

describe("RegistrationsController", () => {
  let controller: RegistrationsController;

  const registrationsServiceMock = {
    create: jest.fn(),
    findUserRegistrations: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [RegistrationsController],
        providers: [
          {
            provide: RegistrationsService,
            useValue: registrationsServiceMock,
          },
        ],
      }).compile();

    controller = module.get(RegistrationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("returns registrations belonging to the user", async () => {
    registrationsServiceMock.findUserRegistrations.mockResolvedValue(
      [],
    );

    const request = {
      user: { id: "user_1" },
    };

    await expect(
      controller.findMine(request),
    ).resolves.toEqual([]);

    expect(
      registrationsServiceMock.findUserRegistrations,
    ).toHaveBeenCalledWith("user_1");
  });
});
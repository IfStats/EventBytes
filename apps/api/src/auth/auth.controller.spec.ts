
import { Test, TestingModule } from "@nestjs/testing";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    getMe: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authServiceMock,
          },
        ],
      }).compile();

    controller =
      module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("delegates registration to AuthService", async () => {
    const dto = {
      email: "test@example.com",
      password: "Password123!",
    };

    const expectedResult = {
      user: {
        id: "user_1",
      },
    };

    authServiceMock.register.mockResolvedValue(
      expectedResult
    );

    await expect(
      controller.register(dto as never)
    ).resolves.toEqual(expectedResult);

    expect(
      authServiceMock.register
    ).toHaveBeenCalledWith(dto);
  });

  it("delegates login to AuthService", async () => {
    const dto = {
      email: "test@example.com",
      password: "Password123!",
    };

    const expectedResult = {
      tokens: {
        accessToken: "test-access-token",
      },
    };

    authServiceMock.login.mockResolvedValue(
      expectedResult
    );

    await expect(
      controller.login(dto as never)
    ).resolves.toEqual(expectedResult);

    expect(
      authServiceMock.login
    ).toHaveBeenCalledWith(dto);
  });

  it("delegates token refresh to AuthService", async () => {
    const expectedResult = {
      refreshToken: "new-refresh-token",
    };

    authServiceMock.refresh.mockResolvedValue(
      expectedResult
    );

    await expect(
      controller.refresh("old-refresh-token")
    ).resolves.toEqual(expectedResult);

    expect(
      authServiceMock.refresh
    ).toHaveBeenCalledWith(
      "old-refresh-token"
    );
  });

  it("returns the authenticated user", async () => {
    const request = {
      user: {
        id: "user_1",
        email: "test@example.com",
      },
    };

    const expectedUser = {
      id: "user_1",
      email: "test@example.com",
    };

    authServiceMock.getMe.mockResolvedValue(
      expectedUser
    );

    await expect(
      controller.getMe(request)
    ).resolves.toEqual(expectedUser);

    expect(
      authServiceMock.getMe
    ).toHaveBeenCalledTimes(1);

    expect(
      authServiceMock.getMe
    ).toHaveBeenCalledWith("user_1");
  });
});

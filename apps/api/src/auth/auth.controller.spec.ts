/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates register requests to the auth service', async () => {
    authServiceMock.register.mockResolvedValue({ user: { id: 'user_1' } });

    await expect(
      controller.register({
        email: 'test@example.com',
        password: 'password123',
      } as never),
    ).resolves.toEqual({ user: { id: 'user_1' } });

    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('delegates login requests to the auth service', async () => {
    authServiceMock.login.mockResolvedValue({ tokens: { accessToken: 'token' } });

    await expect(
      controller.login({
        email: 'test@example.com',
        password: 'Password123!',
      } as never),
    ).resolves.toEqual({ tokens: { accessToken: 'token' } });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
    });
  });

  it('delegates refresh requests to the auth service', async () => {
    authServiceMock.refresh.mockResolvedValue({ refreshToken: 'next-token' });

    await expect(controller.refresh('refresh-token')).resolves.toEqual({
      refreshToken: 'next-token',
    });

    expect(authServiceMock.refresh).toHaveBeenCalledWith('refresh-token');
  });

  it('returns the authenticated user for me', () => {
    const request = {
      user: {
        id: 'user_1',
        email: 'test@example.com',
      },
    } as never;

    expect(controller.me(request)).toEqual({
      id: 'user_1',
      email: 'test@example.com',
    });
  });
});

/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a new user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      isVerified: false,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      memberships: [],
      sessions: [],
      refreshTokens: [],
      auditLogs: [],
    });

    const result = await service.register({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        passwordHash: expect.any(String),
        firstName: 'Test',
        lastName: 'User',
      },
    });
    expect(result).toMatchObject({
      id: 'user_1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isVerified: false,
      isActive: true,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects duplicate emails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
    });

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Email already in use');
  });

  it('logs in an existing user', async () => {
    const passwordHash = await argon2.hash('Password123!');

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      isVerified: false,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    jwtServiceMock.signAsync.mockResolvedValue('signed-access-token');
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 'refresh_1',
      token: 'generated-refresh-token',
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(result).toMatchObject({
      user: {
        id: 'user_1',
        email: 'test@example.com',
      },
      accessToken: 'signed-access-token',
      refreshToken: expect.any(String),
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: 'user_1',
      email: 'test@example.com',
    });
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
      data: {
        token: expect.any(String),
        userId: 'user_1',
        expiresAt: expect.any(Date),
      },
    });
  });

  it('rejects invalid login credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('refreshes tokens for a valid refresh token', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh_1',
      token: 'valid-refresh-token',
      userId: 'user_1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user: {
        id: 'user_1',
        email: 'test@example.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        isVerified: false,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    prismaMock.refreshToken.update.mockResolvedValue({
      id: 'refresh_1',
    });
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 'refresh_2',
      token: 'generated-refresh-token',
    });
    jwtServiceMock.signAsync.mockResolvedValue('signed-access-token');

    const result = await service.refresh('valid-refresh-token');

    expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-refresh-token' },
      include: { user: true },
    });
    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh_1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toMatchObject({
      user: {
        id: 'user_1',
        email: 'test@example.com',
      },
      accessToken: 'signed-access-token',
      refreshToken: expect.any(String),
    });
  });

  it('rejects invalid refresh tokens', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    await expect(service.refresh('bad-token')).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('revokes a refresh token on logout', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh_1',
      token: 'valid-refresh-token',
      userId: 'user_1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prismaMock.refreshToken.update.mockResolvedValue({
      id: 'refresh_1',
    });

    await expect(service.logout('valid-refresh-token')).resolves.toEqual({
      success: true,
    });

    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh_1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

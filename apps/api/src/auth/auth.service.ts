import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { RefreshToken, User } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type SafeUser = Omit<User, 'passwordHash'>;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<SafeUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });

    const { passwordHash: _, ...safeUser } = user;

    return safeUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const { passwordHash: _, ...safeUser } = user;
    const tokens = await this.generateTokens(safeUser.id, safeUser.email);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const storedRefreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!this.isRefreshTokenUsable(storedRefreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedRefreshToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const { passwordHash: _, ...safeUser } = storedRefreshToken.user;
    const tokens = await this.generateTokens(safeUser.id, safeUser.email);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    const storedRefreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
    });

    if (!storedRefreshToken || storedRefreshToken.revokedAt) {
      return {
        success: true,
      };
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedRefreshToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
    });
    const refreshToken = randomBytes(64).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private isRefreshTokenUsable(
    refreshToken: (RefreshToken & { user: User }) | null,
  ): refreshToken is RefreshToken & { user: User } {
    return Boolean(
      refreshToken
      && !refreshToken.revokedAt
      && refreshToken.expiresAt > new Date(),
    );
  }
}

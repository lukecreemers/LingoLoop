import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface AuthPayload {
  sub: string; // userId
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
  activeCourse: {
    id: string;
    targetLanguage: string;
    nativeLanguage: string;
    level: string;
  } | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
    });

    const token = this.signToken(user.id, user.email);

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user.id, user.email);

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const activeCourse = user.courses[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: activeCourse?.onboardingCompleted ?? false,
      activeCourse: activeCourse
        ? {
            id: activeCourse.id,
            targetLanguage: activeCourse.targetLanguage,
            nativeLanguage: activeCourse.nativeLanguage,
            level: activeCourse.level,
          }
        : null,
    };
  }

  private signToken(userId: string, email: string): string {
    const payload: AuthPayload = { sub: userId, email };
    return this.jwt.sign(payload);
  }
}


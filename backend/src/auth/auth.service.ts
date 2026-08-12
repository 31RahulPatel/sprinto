import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const organizationId = dto.organizationName
      ? (await this.prisma.organization.create({ data: { name: dto.organizationName } })).id
      : undefined;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'SUPER_ADMIN',
        organizationId,
      },
      select: userSelect,
    });

    return this.signIn(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...userSelect, passwordHash: true },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'DISABLED') {
      throw new UnauthorizedException('This account has been disabled');
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return this.signIn(safeUser);
  }

  private signIn(user: { id: string; role: string }) {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { accessToken, user };
  }
}

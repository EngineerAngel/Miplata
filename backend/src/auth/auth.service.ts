import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Ya existe un usuario con ese correo')

    const password = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        nombre: dto.nombre,
        ingresoFijo: dto.ingresoFijo,
      },
    })
    return this.signToken(user.id, user.email)
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Credenciales inválidas')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')

    return this.signToken(user.id, user.email)
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, ingresoFijo: true, createdAt: true },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  private async signToken(userId: string, email: string) {
    const payload = { sub: userId, email }
    const token = await this.jwt.signAsync(payload)
    return { access_token: token, user: { id: userId, email } }
  }
}

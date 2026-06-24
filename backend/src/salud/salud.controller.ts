import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { SaludService } from './salud.service'

@UseGuards(JwtAuthGuard)
@Controller('salud')
export class SaludController {
  constructor(private readonly salud: SaludService) {}

  @Get()
  dashboard(@CurrentUser() user: { id: string }) {
    return this.salud.dashboard(user.id)
  }
}

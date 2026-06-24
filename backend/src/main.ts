import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const port = config.get<number>('PORT') ?? 4000
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000'

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })

  await app.listen(port)
  Logger.log(`🚀 MiPlata backend en http://localhost:${port}/api`, 'Bootstrap')
}
bootstrap()

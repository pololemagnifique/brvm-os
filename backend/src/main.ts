import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

  app.setGlobalPrefix(apiPrefix);

  // Disclaimer header on all responses
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Disclaimer', 'Les données sont fournies à titre informatif uniquement. Pas un conseil en investissement. Source : brvm.org');
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3001'],
    credentials: true,
  });

  await app.listen(port);
  console.log(`🚀 BRVM-OS API running on http://localhost:${port}/${apiPrefix}`);
}
bootstrap();

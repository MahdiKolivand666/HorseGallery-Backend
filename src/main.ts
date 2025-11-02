import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdPipe } from './shared/pipes/id.pipe';
import { DuplicateFilter } from './shared/filters/duplicate.filter';
import helmet from 'helmet';

async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Get ConfigService instance
  const configService = app.get(ConfigService);

  // Helmet middleware configures HTTP headers for security against XSS and click-jacking attacks
  app.use(helmet());

  // Enable CORS with proper configuration
  app.enableCors({
    origin:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // IdPipe validates MongoDB ObjectId format
  app.useGlobalPipes(new IdPipe());

  // DuplicateFilter handles MongoDB duplicate key errors
  app.useGlobalFilters(new DuplicateFilter());

  // Swagger API documentation configuration
  const config = new DocumentBuilder()
    .setTitle('Gold Gallery API')
    .setDescription('Backend API for Gold Gallery E-commerce Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/documentation', app, document);

  // Start server on port 4001
  await app.listen(4001);
}
bootstrap();

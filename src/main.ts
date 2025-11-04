import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdPipe } from './shared/pipes/id.pipe';
import { DuplicateFilter } from './shared/filters/duplicate.filter';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Get ConfigService instance
  const configService = app.get(ConfigService);

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================

  // 1. Helmet - Security Headers (XSS, Clickjacking, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // For Swagger UI compatibility
    }),
  );

  // 2. Request Size Limiting (Prevent DoS attacks)
  app.use(express.json({ limit: '10mb' })); // Limit JSON body size
  app.use(express.urlencoded({ limit: '10mb', extended: true })); // Limit URL-encoded body size

  // 3. Cookie Parser (Required for CSRF protection)
  app.use(cookieParser());

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : ['http://localhost:4000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-XSRF-Token',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // Cache preflight requests for 10 minutes
  });

  // ============================================================================
  // VALIDATION PIPES
  // ============================================================================

  // Global validation pipe for request validation with security enhancements
  const isProduction = configService.get('NODE_ENV') === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction, // Hide detailed validation errors in production
    }),
  );

  // IdPipe validates MongoDB ObjectId format
  app.useGlobalPipes(new IdPipe());

  // DuplicateFilter handles MongoDB duplicate key errors
  app.useGlobalFilters(new DuplicateFilter());

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================

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

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IdPipe } from './shared/pipes/id.pipe';
import { DuplicateFilter } from './shared/filters/duplicate.filter';
// import { LogFilter } from './shared/fiters/log.filter';
// import { ApiKeyGuard } from './shared/guards/api-key.guard';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const csrf = require('als-csrf');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // app.use(csrf()); // Temporarily disabled for testing
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalPipes(new IdPipe());
  app.useGlobalFilters(new DuplicateFilter());

  // app.useGlobalGuards(new ApiKeyGuard());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Nest App')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/documentation', app, document);

  await app.listen(3002);
}
bootstrap();

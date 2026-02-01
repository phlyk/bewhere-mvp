import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import dataSource from './config/typeorm.config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Initialize and run migrations before starting the app
  logger.log('🔄 Initializing database connection...');
  await dataSource.initialize();
  logger.log('✅ Database connection established');

  logger.log('🔄 Running database migrations...');
  const migrations = await dataSource.runMigrations();
  if (migrations.length > 0) {
    logger.log(`✅ Applied ${migrations.length} migration(s):`);
    migrations.forEach((m) => logger.log(`   - ${m.name}`));
  } else {
    logger.log('✅ Database is up to date (no pending migrations)');
  }

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS for local development
  // Support comma-separated origins for flexibility
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((origin) => origin.trim());
  
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('BeWhere API')
    .setDescription('Crime Statistics API for French Départements')
    .setVersion('0.1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('areas', 'Administrative areas (départements, regions)')
    .addTag('crimes', 'Crime statistics and observations')
    .addTag('categories', 'Crime categories taxonomy')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 BeWhere API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

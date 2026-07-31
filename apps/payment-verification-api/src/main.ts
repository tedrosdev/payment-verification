import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Configure Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Payment Verification & Ticketing API')
    .setDescription(
      'API documentation for Verify.ET payment reference verification, batch giveaway management, and instant ticket code generation.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter admin JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Verify.ET API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Payment Verification API running on port ${port} (prefix /api/v1)`);
  logger.log(`Swagger OpenAPI Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();

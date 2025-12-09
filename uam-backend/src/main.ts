import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    // CORS configuration
    const corsOriginsEnv = process.env.CORS_ORIGIN;
    const defaultOrigins = ['http://localhost:5173', 'http://localhost:4200'];

    const allowedOrigins = corsOriginsEnv
        ? corsOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
        : defaultOrigins;

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    // Swagger API documentation
    const config = new DocumentBuilder()
        .setTitle('UAM Service API')
        .setDescription('User Access Management Service - Multi-tenant RBAC with OAuth2')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('roles', 'Role management')
        .addTag('permissions', 'Permission management')
        .addTag('invitations', 'Employee invitations')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 UAM Service is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();

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

    // CORS configuration (dev-friendly: allow any origin, reflect at runtime)
    app.enableCors({
        origin: true, // Reflects the requesting origin in Access-Control-Allow-Origin
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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

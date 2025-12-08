import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true, // Enable raw body for webhook signature verification
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS
    app.enableCors();

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Multi-Tenant SaaS API')
        .setDescription('Backend API for multi-tenant SaaS platform with subscription management')
        .setVersion('1.0')
        .addTag('plans', 'Plan management endpoints')
        .addTag('products', 'Product management endpoints')
        .addTag('features', 'Feature management endpoints')
        .addTag('subscriptions', 'Subscription management endpoints')
        .addTag('payments', 'Payment order management endpoints')
        .addTag('webhooks', 'Webhook endpoints for payment gateway events')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();

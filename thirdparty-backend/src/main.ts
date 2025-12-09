import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Simple CORS configuration (dev-friendly)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 5003;
  await app.listen(port);

  console.log(`🚀 Third-party test backend is running on: http://localhost:${port}`);
}

bootstrap();



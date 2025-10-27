import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  process.env['HTTPS_PROXY'] = '';
  process.env['HTTP_PROXY'] = '';
  process.env['NODE_NO_HTTP2'] = '1';

  const app = await NestFactory.create(AppModule);
  // Railway provides PORT environment variable
  const port = process.env.PORT || 3000;

  // Enable CORS for Railway deployment
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

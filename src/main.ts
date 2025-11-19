import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, // Nếu frontend dùng cookie/session
  });

  app.setGlobalPrefix('api/v1');


  const config = new DocumentBuilder()
    .setTitle('Nest talk API')
    .setVersion('1.0')
    // .addBearerAuth()
    // .addCookieAuth('access_token')
    .addServer('http://localhost:8080')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);


  await app.listen(port);
}
bootstrap();

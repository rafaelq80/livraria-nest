import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
  .setTitle('Projeto Livraria')
  .setDescription('Projeto Livraria')
  .setContact("Rafael Queiróz","https://github.com/rafaelq80","rafaelproinfo@gmail.com")
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/swagger', app, document);

  process.env.TZ  = 'America/Sao_Paulo';

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(process.env.PORT ?? 4000);

}
bootstrap();

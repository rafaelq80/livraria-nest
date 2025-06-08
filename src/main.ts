import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

  // Configurações de segurança
  //app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

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

  await app.listen(process.env.PORT ?? 4000);

}
bootstrap();

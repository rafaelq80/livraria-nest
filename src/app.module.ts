import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsuarioModule } from './usuario/usuario.module';
import { AutorModule } from './autor/autor.module';
import { ProdutoModule } from './produto/produto.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './security/guards/jwt-auth.guard';
import { SecurityModule } from './security/security.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from "./app.controller"
import { DevService } from "./data/services/dev.service"
import { EditoraModule } from "./editora/editora.module"
import { SendmailModule } from "./sendmail/sendmail.module"
import { AppConfigModule } from "./config/config.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		ThrottlerModule.forRoot([{
			ttl: 60, // tempo em segundos
			limit: 10, // número máximo de requisições
		}]),
		AppConfigModule,
		TypeOrmModule.forRootAsync({
			useClass: DevService,
			imports: [AppConfigModule],
		}),
		ProdutoModule,
		AutorModule,
		CategoriaModule,
		EditoraModule,
		UsuarioModule,
		SecurityModule,
		SendmailModule,
	],
	controllers: [AppController],
	providers: [
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	],
})
export class AppModule {}

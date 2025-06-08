import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from "./app.controller"
import { AutorModule } from "./autor/autor.module"
import { CategoriaModule } from "./categoria/categoria.module"
import { DevService } from "./data/services/dev.service"
import { EditoraModule } from "./editora/editora.module"
import { ProdutoModule } from "./produto/produto.module"
import { RoleModule } from "./role/role.module"
import { SecurityModule } from "./security/security.module"
import { SendmailModule } from "./sendmail/sendmail.module"
import { UsuarioModule } from "./usuario/usuario.module"
import { AppConfigModule } from "./config/config.module"
import { JwtAuthGuard } from "./security/guards/jwt-auth.guard"

@Module({
	imports: [
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
		RoleModule,
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

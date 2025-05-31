import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AppController } from "./app.controller"
import { AutorModule } from "./autor/autor.module"
import { CategoriaModule } from "./categoria/categoria.module"
import { DevService } from "./data/services/dev.service"
import { EditoraModule } from "./editora/editora.module"
import { ProdutoModule } from "./produto/produto.module"
import { RoleModule } from "./role/role.module"
import { SecurityModule } from "./security/security.module"
import { UsuarioModule } from "./usuario/usuario.module"
import { SendmailModule } from "./sendmail/sendmail.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			useClass: DevService,
			imports: [ConfigModule],
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
	providers: [],
})
export class AppModule {}

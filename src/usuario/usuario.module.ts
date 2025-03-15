import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UsuarioController } from "./controllers/usuario.controller"
import { Usuario } from "./entities/usuario.entity"
import { UsuarioService } from "./services/usuario.service"
import { Bcrypt } from "../security/bcrypt/bcrypt"
import { RoleModule } from "../role/role.module"
import { SendmailModule } from "../sendmail/sendmail.module"
import { ImageKitModule } from "../imagekit/imagekit.module"

@Module({
	imports: [TypeOrmModule.forFeature([Usuario]), RoleModule, SendmailModule, ImageKitModule],
	providers: [UsuarioService, Bcrypt],
	controllers: [UsuarioController],
	exports: [UsuarioService],
})
export class UsuarioModule {}

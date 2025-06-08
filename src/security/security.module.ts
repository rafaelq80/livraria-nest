import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { Reflector } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { RoleModule } from "../role/role.module"
import { SendmailModule } from "../sendmail/sendmail.module"
import { UsuarioModule } from "../usuario/usuario.module"
import { Bcrypt } from "./bcrypt/bcrypt"
import { SecurityController } from "./controllers/security.controller"
import { RecuperarSenhaService } from "./services/recuperarsenha.service"
import { SecurityService } from "./services/security.service"
import { GoogleStrategy } from "./strategies/google.strategy"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { LocalStrategy } from "./strategies/local.strategy"
import { GoogleController } from "./controllers/google.controller";

@Module({
	imports: [
		UsuarioModule,
		RoleModule,
		PassportModule,
		SendmailModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>("JWT_SECRET"),
				signOptions: {
					expiresIn: "1h",
				},
			}),
			inject: [ConfigService],
		}),
	],
	providers: [
		Reflector,
		Bcrypt,
		SecurityService,
		LocalStrategy,
		JwtStrategy,
		GoogleStrategy,
		RecuperarSenhaService,
	],
	controllers: [SecurityController, GoogleController],
	exports: [Bcrypt, JwtModule],
})
export class SecurityModule {}
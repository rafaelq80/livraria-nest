import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { SendmailModule } from "../sendmail/sendmail.module"
import { UsuarioModule } from "../usuario/usuario.module"
import { Bcrypt } from "./bcrypt/bcrypt"
import { SecurityController } from "./controllers/security.controller"
import { RecuperarSenhaService } from "./services/recuperarsenha.service"
import { SecurityService } from "./services/security.service"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { LocalStrategy } from "./strategies/local.strategy"

@Module({
	imports: [
		UsuarioModule,
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
		Bcrypt,
		SecurityService,
		LocalStrategy,
		JwtStrategy,
		RecuperarSenhaService,
	],
	controllers: [SecurityController],
	exports: [Bcrypt, JwtModule],
})
export class SecurityModule {}

import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-local"
import { SecurityService } from "../services/security.service"
import { UsuarioAutenticado } from "../interfaces/usuarioautenticado.interface"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly securityService: SecurityService,
		private readonly usuarioService: UsuarioService,
		private readonly configService: ConfigService
	) {
		const authConfig = configService.get('auth');
		
		super({
			usernameField: authConfig.usernameField,
			passwordField: authConfig.passwordField,
			session: authConfig.sessionEnabled,
		})
	}

	async validate(usuario: string, senha: string): Promise<UsuarioAutenticado> {
		const validarUsuario = await this.securityService.validateUser(usuario, senha)

		if (!validarUsuario)
			throw new UnauthorizedException(ErrorMessages.AUTH.INVALID_CREDENTIALS)

		const usuarioCompleto = await this.usuarioService.findByUsuario(usuario)
		if (!usuarioCompleto)
			throw new UnauthorizedException(ErrorMessages.AUTH.USER_NOT_FOUND)

		return this.securityService.login(usuarioCompleto)
	}
}

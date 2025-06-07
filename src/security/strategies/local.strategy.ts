import { Injectable, UnauthorizedException } from "@nestjs/common"
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
		private readonly usuarioService: UsuarioService
	) {
		const USUARIO = "usuario"
		const SENHA = "senha"
		
		super({
			usernameField: USUARIO,
			passwordField: SENHA,
			session: false,
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

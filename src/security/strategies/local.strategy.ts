import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-local"
import { SecurityService } from "../services/security.service"

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly securityService: SecurityService) {
		super({
			usernameField: "usuario",
			passwordField: "senha",
			session: false,
		})
	}

	async validate(usuario: string, senha: string): Promise<UsuarioAutenticado> {

		const validarUsuario = await this.securityService.validateUser(usuario, senha)

		if (!validarUsuario)
			throw new UnauthorizedException("Usuário e/ou senha incorretos!")

		return validarUsuario as UsuarioAutenticado
	}
}

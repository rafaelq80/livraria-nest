import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-local"
import { SecurityService } from "../services/security.service"
import { UsuarioAutenticado } from "../types/usuarioautenticado"

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly securityService: SecurityService) {
		
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
			throw new UnauthorizedException("Usuário e/ou senha incorretos!")

		return validarUsuario as UsuarioAutenticado
	}
}

import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ErrorMessages } from "../../common/constants/error-messages"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { Bcrypt } from "../bcrypt/bcrypt"
import { JwtPayload } from "../interfaces/jwtpayload.interface"
import { UsuarioAutenticado } from "../interfaces/usuarioautenticado.interface"

@Injectable()
export class SecurityService {
	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly jwtService: JwtService,
		private readonly bcrypt: Bcrypt,
	) {}

	async validateUser(usuario: string, senha: string): Promise<Omit<Usuario, 'senha'>> {
		this.validarCredenciais(usuario, senha)
		const [usuarioSanitizado, senhaSanitizada] = this.sanitizarCredenciais(usuario, senha)

		const buscaUsuario = await this.usuarioService.findByUsuario(usuarioSanitizado)

		if (!buscaUsuario) {
			throw new UnauthorizedException(ErrorMessages.AUTH.USER_NOT_FOUND)
		}

		const match = await this.bcrypt.compararSenhas(senhaSanitizada, buscaUsuario.senha)

		if (!match) {
			throw new UnauthorizedException(ErrorMessages.AUTH.INVALID_PASSWORD)
		}

		const usuarioSemSenha = { ...buscaUsuario }
		delete usuarioSemSenha.senha
		return usuarioSemSenha
	}

	async login(usuario: Usuario): Promise<UsuarioAutenticado> {
		const token = this.gerarToken(usuario.usuario)

		return {
			id: usuario.id,
			nome: usuario.nome,
			usuario: usuario.usuario,
			foto: usuario.foto,
			roles: usuario.roles,
			token,
		}
	}

	async loginGoogle(id: string): Promise<UsuarioAutenticado> {
		const usuario = await this.usuarioService.findByGoogleId(id)

		if (!usuario) {
			throw new UnauthorizedException(ErrorMessages.AUTH.USER_NOT_FOUND)
		}

		return this.login(usuario)
	}

	private validarCredenciais(usuario: string, senha: string): void {
		if (!usuario?.trim() || !senha?.trim()) {
			throw new BadRequestException(ErrorMessages.AUTH.CREDENTIALS_REQUIRED)
		}
	}

	private sanitizarCredenciais(usuario: string, senha: string): [string, string] {
		return [usuario.trim().toLowerCase(), senha.trim()]
	}

	gerarToken(usuario: string): string {
		const payload: JwtPayload = { sub: usuario }
		return `Bearer ${this.jwtService.sign(payload)}`
	}
}
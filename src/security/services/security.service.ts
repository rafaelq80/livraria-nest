import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common"
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
		const buscaUsuario = await this.usuarioService.findByUsuario(usuario)

		if (!buscaUsuario) {
			throw new UnauthorizedException(ErrorMessages.AUTH.USER_NOT_FOUND)
		}

		const match = await this.bcrypt.compararSenhas(senha, buscaUsuario.senha)

		if (!match) {
			throw new UnauthorizedException(ErrorMessages.AUTH.INVALID_PASSWORD)
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { senha: _, ...result } = buscaUsuario
		return result
	}

	async login(usuario: Usuario): Promise<UsuarioAutenticado> {
		const payload = {
			sub: usuario.id,
			usuario: usuario.usuario,
			nome: usuario.nome,
			roles: usuario.roles.map((role) => role.nome),
		}

		const token = this.jwtService.sign(payload)

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
			throw new HttpException(ErrorMessages.AUTH.CREDENTIALS_REQUIRED, HttpStatus.BAD_REQUEST)
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
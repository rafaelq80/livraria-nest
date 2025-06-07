import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { Bcrypt } from "../bcrypt/bcrypt"
import { UsuarioLoginDto } from "../dto/usuariologin.dto"
import { UsuarioAutenticado } from "../interfaces/usuarioautenticado.interface"
import { JwtPayload } from "../interfaces/jwtpayload.interface"

@Injectable()
export class SecurityService {
	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly jwtService: JwtService,
		private readonly bcrypt: Bcrypt,
	) {}

	async validateUser(usuario: string, senhaDigitada: string): Promise<Omit<UsuarioAutenticado, "token">> {
		this.validarCredenciais(usuario, senhaDigitada)
		
		const [usuarioNormalizado, senhaNormalizada] = this.sanitizarCredenciais(usuario, senhaDigitada)

		const buscaUsuario = await this.usuarioService.findByUsuario(usuarioNormalizado)
		
		if (!buscaUsuario) 
			throw new HttpException("Usuário não encontrado!", HttpStatus.NOT_FOUND)

		const validarSenha = await this.bcrypt.compararSenhas(senhaNormalizada, buscaUsuario.senha)
		
		if (!validarSenha)
			throw new HttpException("Senha incorreta!", HttpStatus.UNAUTHORIZED)

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { senha, ...dadosUsuario } = buscaUsuario

		return dadosUsuario
	}

	async login(usuarioLogin: UsuarioLoginDto): Promise<UsuarioAutenticado> {
		const usuarioNormalizado = usuarioLogin.usuario.trim().toLowerCase()

		const buscaUsuario = await this.usuarioService.findByUsuario(usuarioNormalizado)

		if (!buscaUsuario) {
			throw new HttpException("Usuário inválido!", HttpStatus.NOT_FOUND)
		}

		const token = this.gerarToken(usuarioNormalizado)

		return {
			id: buscaUsuario.id,
			nome: buscaUsuario.nome,
			usuario: usuarioLogin.usuario,
			foto: buscaUsuario.foto,
			roles: buscaUsuario.roles,
			token,
		}
	}

	// Método para login com Google usando roles simples
	async loginGoogle(usuarioGoogle: {
		id: number
		nome: string
		usuario: string
		email: string
		foto?: string
		roles: Array<{ nome: string }>
		googleId: string
	}): Promise<UsuarioAutenticado> {
		const token = this.gerarToken(usuarioGoogle.usuario)

		return {
			id: usuarioGoogle.id,
			nome: usuarioGoogle.nome,
			usuario: usuarioGoogle.usuario,
			foto: usuarioGoogle.foto,
			roles: usuarioGoogle.roles,
			token,
		}
	}

	private validarCredenciais(usuario: string, senha: string): void {
		if (!usuario?.trim() || !senha?.trim()) {
			throw new HttpException("Usuário e Senha são Obrigatórios!", HttpStatus.BAD_REQUEST)
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
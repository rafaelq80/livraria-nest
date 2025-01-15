import { JwtService } from "@nestjs/jwt"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { Bcrypt } from "../bcrypt/bcrypt"
import { UsuarioLogin } from "../types/usuariologin"

@Injectable()
export class SecurityService {
	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly jwtService: JwtService,
		private readonly bcrypt: Bcrypt,
	) {}

	async validateUser(usuario: string, senha: string): Promise<Omit<UsuarioAutenticado, "token">> {
		
        this.validarCredenciais(usuario, senha)
		
        const [usuarioNormalizado, senhaNormalizada] = this.sanitizarCredenciais(usuario, senha)

		const buscaUsuario = await this.usuarioService.findByUsuario(usuarioNormalizado)
		
        if (!buscaUsuario) 
			throw new HttpException("Usuário não encontrado!", HttpStatus.NOT_FOUND)

		const validarSenha = await this.bcrypt.compararSenhas(senhaNormalizada, buscaUsuario.senha)
		
        if (!validarSenha)
			throw new HttpException("Senha incorreta!", HttpStatus.UNAUTHORIZED)

		const { senha: _, ...dadosUsuario } = buscaUsuario

		return dadosUsuario
	}

	async login(usuarioLogin: UsuarioLogin): Promise<UsuarioAutenticado> {
		
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

	private gerarToken(usuario: string): string {
		const payload: JwtPayload = { sub: usuario }
		return `Bearer ${this.jwtService.sign(payload)}`
	}

}

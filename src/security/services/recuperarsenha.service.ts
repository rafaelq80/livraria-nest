import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { SendmailService } from "../../sendmail/service/sendmail.service"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { SecurityService } from "./security.service"

@Injectable()
export class RecuperarSenhaService {

	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly securityService: SecurityService,
		private readonly jwtService: JwtService,
		private readonly sendmailService: SendmailService
	) {}

	async enviarEmail(usuario: string): Promise<void> {

		const buscaUsuario = await this.usuarioService.findByUsuario(usuario)

		if (!buscaUsuario) {
			// Simulamos o sucesso mesmo se o usuário não existir para evitar enumeração de e-mails
			return
		}

		const token = this.securityService.gerarToken(buscaUsuario.usuario)

		const resetLink = `${process.env.FRONTEND_URL}/atualizarsenha?token=${token}`

		await this.sendmailService.sendmailRecuperarSenha(
			buscaUsuario.nome,
			buscaUsuario.usuario,
			resetLink,
		)
	}

	async atualizarSenha(token: string, novaSenha: string): Promise<{ message: string }> {
		try {
			
			const tokenSemBearer = token.replace("Bearer ", "");

			const decoded = this.jwtService.verify(tokenSemBearer)

			const buscaUsuario = await this.usuarioService.findByUsuario(decoded.sub)

			if (!buscaUsuario) {
				throw new NotFoundException("Usuário não encontrado")
			}

			await this.usuarioService.updateSenha(decoded.sub, novaSenha)

			return { message: "Senha alterada com sucesso" }
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				throw new UnauthorizedException("O link de recuperação expirou")
			}
			throw new UnauthorizedException("Link de recuperação inválido")
		}
	}
}

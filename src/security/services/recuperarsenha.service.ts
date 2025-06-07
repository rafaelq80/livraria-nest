import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { RecuperarSenhaDto } from "../dto/recuperarsenha.dto"
import { SendmailDto } from "../dto/sendmail.dto"
import { SecurityService } from "./security.service"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class RecuperarSenhaService {

	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly securityService: SecurityService,
		private readonly jwtService: JwtService,
		private readonly sendmailService: SendmailService
	) {}

	async enviarEmail(sendmailDto: SendmailDto): Promise<void> {

		const buscaUsuario = await this.usuarioService.findByUsuario(sendmailDto.usuario)

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

	async atualizarSenha(recuperarSenhaDto: RecuperarSenhaDto): Promise<{ message: string }> {
		try {
			
			const tokenSemBearer = recuperarSenhaDto.token.replace("Bearer ", "");

			const decoded = this.jwtService.verify(tokenSemBearer)

			const buscaUsuario = await this.usuarioService.findByUsuario(decoded.sub)

			if (!buscaUsuario) {
				throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)
			}

			await this.usuarioService.updateSenha(decoded.sub, recuperarSenhaDto.senha)

			return { message: "Senha alterada com sucesso" }
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				throw new UnauthorizedException(ErrorMessages.EMAIL.RECOVERY_LINK_EXPIRED)
			}
			throw new UnauthorizedException(ErrorMessages.EMAIL.RECOVERY_LINK_INVALID)
		}
	}
}

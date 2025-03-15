import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common"
import { LocalAuthGuard } from "../guards/local-auth.guard"
import { SecurityService } from "../services/security.service"
import { UsuarioLogin } from "../types/usuariologin"
import { RecuperarSenhaService } from "../services/recuperarsenha.service"
import { RecuperarSenhaDto } from "../dto/recuperarsenha.dto"
import { EnviarEmailDto } from "../dto/enviaremail.dto"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags('Usuário')
@ApiBearerAuth()
@Controller("/usuarios")
export class SecurityController {
	constructor(
        private securityService: SecurityService,
        private recuperarSenhaService: RecuperarSenhaService
    ) {}

	@UseGuards(LocalAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post("/logar")
	login(@Body() user: UsuarioLogin): Promise<any> {
		return this.securityService.login(user)
	}

	@Post("/recuperarsenha")
	async requestRecovery(@Body() usuario: EnviarEmailDto) {
		try {
			await this.recuperarSenhaService.enviarEmail(usuario.usuario)
			return {
				message: "Se o e-mail existir em nossa base, um link de recuperação será enviado para o seu e-mail.",
			}
		} catch (error) {
			// Não expor detalhes específicos do erro para não revelar informações sensíveis
			return {
				message: "Se o e-mail existir em nossa base, um link de recuperação será enviado para o seu e-mail.",
			}
		}
	}

	@Patch("/atualizarsenha")
	async resetPassword(@Body() recuperarSenhaDto: RecuperarSenhaDto) {
		if (recuperarSenhaDto.senha !== recuperarSenhaDto.confirmarSenha) {
			throw new BadRequestException("As senhas não coincidem")
		}

		return this.recuperarSenhaService.atualizarSenha(recuperarSenhaDto.token, recuperarSenhaDto.senha)
	}
}

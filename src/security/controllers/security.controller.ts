import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { RecuperarSenhaDto } from "../dto/recuperarsenha.dto"
import { SendmailDto } from "../dto/sendmail.dto"
import { UsuarioLoginDto } from "../dto/usuariologin.dto"
import { LocalAuthGuard } from "../guards/local-auth.guard"
import { RecuperarSenhaService } from "../services/recuperarsenha.service"
import { SecurityService } from "../services/security.service"

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
	login(@Body() usuario: UsuarioLoginDto): Promise<any> {
		return this.securityService.login(usuario)
	}

	@Post("/recuperarsenha")
	async requestRecovery(@Body() sendmailDto: SendmailDto) {
		try {
			await this.recuperarSenhaService.enviarEmail(sendmailDto)
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

		return this.recuperarSenhaService.atualizarSenha(recuperarSenhaDto)
	}
}

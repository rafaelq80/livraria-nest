import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	UseGuards
} from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { ErrorMessages } from "../../common/constants/error-messages"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { RecuperarSenhaDto } from "../dto/recuperarsenha.dto"
import { SendmailDto } from "../dto/sendmail.dto"
import { UsuarioLoginDto } from "../dto/usuariologin.dto"
import { LocalAuthGuard } from "../guards/local-auth.guard"
import { RecuperarSenhaService } from "../services/recuperarsenha.service"
import { SecurityService } from "../services/security.service"
import { Public } from '../decorators/public.decorator'

@ApiTags("Usuário")
@Controller("/usuarios")
export class SecurityController {
	constructor(
		private readonly securityService: SecurityService,
		private readonly recuperarSenhaService: RecuperarSenhaService,
	) {}

	@Public()
	@UseGuards(LocalAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post("/logar")
	async login(@Body() usuarioLoginDto: UsuarioLoginDto) {
		try {
			const usuario = await this.securityService.validateUser(
				usuarioLoginDto.usuario,
				usuarioLoginDto.senha,
			)
			const data = await this.securityService.login(usuario as Usuario)
			return {
				status: 'success',
				message: 'Login realizado com sucesso.',
				data
			}
		} catch (error) {
			return {
				status: 'error',
				message: error?.message ?? ErrorMessages.AUTH.INVALID_CREDENTIALS,
				data: null
			}
		}
	}

	@Public()
	@Post("/recuperarsenha")
	async requestRecovery(@Body() sendmailDto: SendmailDto) {
		try {
			await this.recuperarSenhaService.enviarEmail(sendmailDto)
			return {
				status: 'success',
				message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado para o seu e-mail.',
				data: null
			}
		} catch {
			return {
				status: 'error',
				message: ErrorMessages.EMAIL.SEND_ERROR,
				data: null
			}
		}
	}

	@Public()
	@Patch("/atualizarsenha")
	async resetPassword(@Body() recuperarSenhaDto: RecuperarSenhaDto) {
		if (recuperarSenhaDto.senha !== recuperarSenhaDto.confirmarSenha) {
			return {
				status: 'error',
				message: ErrorMessages.EMAIL.PASSWORDS_DONT_MATCH,
				data: null
			}
		}

		try {
			const data = await this.recuperarSenhaService.atualizarSenha(recuperarSenhaDto)
			return {
				status: 'success',
				message: 'Senha atualizada com sucesso.',
				data
			}
		} catch (error) {
			return {
				status: 'error',
				message: error?.message ?? ErrorMessages.GENERAL.OPERATION_FAILED,
				data: null
			}
		}
	}
}

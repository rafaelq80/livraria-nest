import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	UseGuards,
	Logger
} from "@nestjs/common"
import { ApiTags, ApiBody, ApiResponse } from "@nestjs/swagger"
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
	private readonly logger = new Logger(SecurityController.name);

	constructor(
		private readonly securityService: SecurityService,
		private readonly recuperarSenhaService: RecuperarSenhaService,
	) {}

	@Public()
	@UseGuards(LocalAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBody({ type: UsuarioLoginDto })
	@ApiResponse({
		status: 200,
		description: 'Login realizado com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Login realizado com sucesso.',
				data: {
					id: 1,
					nome: 'João da Silva',
					usuario: 'joao@email.com',
					foto: 'https://example.com/foto.jpg',
					roles: [{ id: 1, nome: 'user', descricao: 'Usuário padrão' }],
					token: 'Bearer ...'
				}
			}
		}
	})
	@Post("/logar")
	async login(@Body() usuarioLoginDto: UsuarioLoginDto) {
		this.logger.log(`🔐 Tentativa de login para: ${usuarioLoginDto.usuario}`);
		
		try {
			const usuario = await this.securityService.validateUser(
				usuarioLoginDto.usuario,
				usuarioLoginDto.senha,
			)
			const data = await this.securityService.login(usuario as Usuario)
			
			this.logger.log(`✅ Login realizado com sucesso para: ${usuarioLoginDto.usuario}`);
			
			return {
				status: 'success',
				message: 'Login realizado com sucesso.',
				data
			}
		} catch (error) {
			this.logger.warn(`❌ Falha no login para: ${usuarioLoginDto.usuario} - ${error.message}`);
			
			return {
				status: 'error',
				message: error?.message ?? ErrorMessages.AUTH.INVALID_CREDENTIALS,
				data: null
			}
		}
	}

	@Public()
	@ApiBody({ type: SendmailDto })
	@ApiResponse({
		status: 200,
		description: 'Solicitação de recuperação de senha.',
		schema: {
			example: {
				status: 'success',
				message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado para o seu e-mail.',
				data: null
			}
		}
	})
	@Post("/recuperarsenha")
	async requestRecovery(@Body() sendmailDto: SendmailDto) {
		this.logger.log(`📧 Solicitação de recuperação de senha para: ${sendmailDto.usuario}`);
		
		try {
			await this.recuperarSenhaService.enviarEmail(sendmailDto)
			
			this.logger.log(`✅ Email de recuperação enviado para: ${sendmailDto.usuario}`);
			
			return {
				status: 'success',
				message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado para o seu e-mail.',
				data: null
			}
		} catch (error) {
			this.logger.error(`❌ Erro ao enviar email de recuperação para: ${sendmailDto.usuario} - ${error.message}`);
			
			return {
				status: 'error',
				message: ErrorMessages.EMAIL.SEND_ERROR,
				data: null
			}
		}
	}

	@Public()
	@ApiBody({ type: RecuperarSenhaDto })
	@ApiResponse({
		status: 200,
		description: 'Senha atualizada com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Senha atualizada com sucesso.',
				data: null
			}
		}
	})
	@Patch("/atualizarsenha")
	async resetPassword(@Body() recuperarSenhaDto: RecuperarSenhaDto) {
		this.logger.log(`🔐 Tentativa de reset de senha`);
		
		if (recuperarSenhaDto.senha !== recuperarSenhaDto.confirmarSenha) {
			this.logger.warn(`❌ Senhas não coincidem no reset`);
			
			return {
				status: 'error',
				message: ErrorMessages.EMAIL.PASSWORDS_DONT_MATCH,
				data: null
			}
		}

		try {
			const data = await this.recuperarSenhaService.atualizarSenha(recuperarSenhaDto)
			
			this.logger.log(`✅ Senha atualizada com sucesso`);
			
			return {
				status: 'success',
				message: 'Senha atualizada com sucesso.',
				data
			}
		} catch (error) {
			this.logger.error(`❌ Erro ao atualizar senha: ${error.message}`);
			
			return {
				status: 'error',
				message: error?.message ?? ErrorMessages.GENERAL.OPERATION_FAILED,
				data: null
			}
		}
	}
}

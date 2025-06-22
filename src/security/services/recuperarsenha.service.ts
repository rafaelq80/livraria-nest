import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { RecuperarSenhaDto } from "../dto/recuperarsenha.dto"
import { SendmailDto } from "../dto/sendmail.dto"
import { SecurityService } from "./security.service"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class RecuperarSenhaService {
	private readonly logger = new Logger(RecuperarSenhaService.name);
	private readonly requestCounts = new Map<string, { count: number; lastRequest: number }>();

	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly securityService: SecurityService,
		private readonly jwtService: JwtService,
		private readonly sendmailService: SendmailService,
		private readonly configService: ConfigService
	) {}

	private validateRateLimit(email: string): void {
		const authConfig = this.configService.get('auth');
		const now = Date.now();
		const windowMs = authConfig.lockoutDuration;
		const maxRequests = authConfig.maxLoginAttempts;

		const userRequests = this.requestCounts.get(email) || { count: 0, lastRequest: 0 };

		// Reset se passou o tempo da janela
		if (now - userRequests.lastRequest > windowMs) {
			userRequests.count = 0;
		}

		if (userRequests.count >= maxRequests) {
			this.logger.warn(`Rate limit excedido para: ${email}`);
			throw new BadRequestException(ErrorMessages.AUTH.TOO_MANY_ATTEMPTS);
		}

		userRequests.count++;
		userRequests.lastRequest = now;
		this.requestCounts.set(email, userRequests);
	}

	private validatePasswordChange(currentPassword: string, newPassword: string): void {
		if (currentPassword === newPassword) {
			throw new BadRequestException(ErrorMessages.USER.PASSWORD_MISMATCH);
		}
	}

	async enviarEmail(sendmailDto: SendmailDto): Promise<void> {
		this.logger.log(`📧 Iniciando processo de recuperação de senha para: ${sendmailDto.usuario}`);

		try {
			// Rate limiting
			this.validateRateLimit(sendmailDto.usuario);

			const buscaUsuario = await this.usuarioService.findByUsuario(sendmailDto.usuario);

		if (!buscaUsuario) {
			// Simulamos o sucesso mesmo se o usuário não existir para evitar enumeração de e-mails
				this.logger.log(`📧 Email de recuperação simulado para usuário inexistente: ${sendmailDto.usuario}`);
				return;
		}

			const token = this.securityService.gerarToken(buscaUsuario.usuario);
			const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
			const resetLink = `${frontendUrl}/atualizarsenha?token=${token}`;

			this.logger.log(`🔗 Link de recuperação gerado para: ${buscaUsuario.usuario}`);

			await this.sendmailService.sendmailRecuperarSenhaLegacy(
			buscaUsuario.nome,
			buscaUsuario.usuario,
				resetLink
			);

			this.logger.log(`✅ Email de recuperação enviado com sucesso para: ${buscaUsuario.usuario}`);
		} catch (error) {
			this.logger.error(`❌ Erro ao enviar email de recuperação para ${sendmailDto.usuario}:`, error.message);
			throw error;
		}
	}

	async atualizarSenha(recuperarSenhaDto: RecuperarSenhaDto): Promise<{ message: string }> {
		this.logger.log(`🔐 Iniciando atualização de senha`);

		try {
			// Validação de confirmação de senha
			if (recuperarSenhaDto.senha !== recuperarSenhaDto.confirmarSenha) {
				throw new BadRequestException(ErrorMessages.EMAIL.PASSWORDS_DONT_MATCH);
			}
			
			const tokenSemBearer = recuperarSenhaDto.token.replace("Bearer ", "");

			let decoded: { sub: string; iat: number; exp: number };
			try {
				decoded = this.jwtService.verify(tokenSemBearer);
			} catch (jwtError) {
				if (jwtError.name === "TokenExpiredError") {
					this.logger.warn(`⏰ Token expirado para recuperação de senha`);
					throw new UnauthorizedException(ErrorMessages.EMAIL.RECOVERY_LINK_EXPIRED);
				}
				this.logger.warn(`❌ Token inválido para recuperação de senha`);
				throw new UnauthorizedException(ErrorMessages.EMAIL.RECOVERY_LINK_INVALID);
			}

			const buscaUsuario = await this.usuarioService.findByUsuario(decoded.sub);

			if (!buscaUsuario) {
				this.logger.warn(`❌ Usuário não encontrado para recuperação: ${decoded.sub}`);
				throw new NotFoundException(ErrorMessages.USER.NOT_FOUND);
			}

			// Valida se a nova senha é diferente da atual
			this.validatePasswordChange(buscaUsuario.senha, recuperarSenhaDto.senha);

			await this.usuarioService.updateSenha(decoded.sub, recuperarSenhaDto.senha);

			// Limpa o rate limit após sucesso
			this.requestCounts.delete(decoded.sub);

			this.logger.log(`✅ Senha atualizada com sucesso para: ${decoded.sub}`);

			return { message: "Senha alterada com sucesso" };
		} catch (error) {
			this.logger.error(`❌ Erro ao atualizar senha:`, error.message);
			
			if (error instanceof BadRequestException || 
				error instanceof UnauthorizedException || 
				error instanceof NotFoundException) {
				throw error;
			}
			
			throw new UnauthorizedException(ErrorMessages.EMAIL.RECOVERY_LINK_INVALID);
		}
	}

	// Método para limpeza periódica do rate limiting
	cleanupRateLimits(): void {
		const authConfig = this.configService.get('auth');
		const now = Date.now();
		const windowMs = authConfig.lockoutDuration;

		for (const [email, data] of this.requestCounts.entries()) {
			if (now - data.lastRequest > windowMs) {
				this.requestCounts.delete(email);
			}
		}
	}
}

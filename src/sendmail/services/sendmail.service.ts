import { Injectable, Logger, BadRequestException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from 'nodemailer';
import { SendMailDto, SendMailConfirmacaoDto, SendMailRecuperarSenhaDto, EmailTemplate } from '../dto/sendmail.dto';
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_HTML } from '../templates/email-templates';
import { ErrorMessages } from '../../common/constants/error-messages';


@Injectable()
export class SendmailService {
	private transporter: nodemailer.Transporter;
	private readonly logger = new Logger(SendmailService.name);

	constructor(private readonly configService: ConfigService) {
		this.validateConfiguration();
		this.initializeTransporter();
	}

	private validateConfiguration(): void {
		const mailConfig = this.configService.get('mail');
		
		if (!mailConfig?.auth?.user || !mailConfig?.auth?.pass) {
			throw new Error('Configurações de email não encontradas. Verifique EMAIL_USER e EMAIL_PASSWORD.');
		}

		this.logger.log('✅ Configurações de email validadas com sucesso');
	}

	private initializeTransporter(): void {
		const mailConfig = this.configService.get('mail');
		
		this.transporter = nodemailer.createTransport({
			host: mailConfig.host,
			port: mailConfig.port,
			secure: mailConfig.secure,
			auth: mailConfig.auth,
			connectionTimeout: mailConfig.connectionTimeout ?? 60000,
			greetingTimeout: mailConfig.greetingTimeout ?? 30000,
			socketTimeout: mailConfig.socketTimeout ?? 60000,
			tls: mailConfig.tls ?? {
				rejectUnauthorized: false
			}
		});

		// Verifica a conexão com o servidor de email
		this.transporter.verify((error) => {
			if (error) {
				this.logger.error('❌ Erro na conexão com o servidor de email:', error);
			} else {
				this.logger.log('📧 Serviço de email conectado com sucesso!');
			}
		});
	}

	private validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	private async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private async sendMailWithRetry(mailOptions: nodemailer.SendMailOptions, maxRetries = 3): Promise<nodemailer.SentMessageInfo> {
		const mailConfig = this.configService.get('mail');
		const retries = mailConfig.maxRetries ?? maxRetries;
		const retryDelay = mailConfig.retryDelay ?? 1000;

		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				this.logger.log(`📧 Tentativa ${attempt}/${retries} de envio de email`);
				return await this.transporter.sendMail(mailOptions);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
    		this.logger.warn(`⚠️ Tentativa ${attempt} falhou: ${message}`);
				
				if (attempt === retries) {
					this.logger.error(`❌ Todas as ${retries} tentativas falharam`);
					throw error;
				}
				
				// Exponential backoff
				const delay = retryDelay * attempt;
				this.logger.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
				await this.delay(delay);
			}
		}
		
		throw new Error('Erro inesperado no envio de email');
	}

	private async verificarEntrega(info: nodemailer.SentMessageInfo): Promise<boolean> {
		try {
			// Verifica se o email foi aceito pelo servidor
			if (info.accepted && info.accepted.length > 0) {
				this.logger.log(`✅ Email aceito pelo servidor para: ${info.accepted.join(', ')}`);
				return true;
			}

			// Verifica se o email foi rejeitado
			if (info.rejected && info.rejected.length > 0) {
				this.logger.error(`❌ Email rejeitado para: ${info.rejected.join(', ')}`);
				return false;
			}

			// Verifica o status da mensagem
			if (info.response) {
				this.logger.log(`📨 Resposta do servidor: ${info.response}`);
				return info.response.includes('250');
			}

			return false;
		} catch (error) {
			this.logger.error('❌ Erro ao verificar entrega do email:', error);
			return false;
		}
	}

	private async logMetrics(success: boolean, emailType: string, recipient: string): Promise<void> {
		const status = success ? '✅ Sucesso' : '❌ Falha';
		this.logger.log(`📊 Métrica: ${emailType} - ${status} - ${recipient}`);
	}

	async sendMail(sendMailDto: SendMailDto): Promise<void> {
		// Validação
		if (!this.validateEmail(sendMailDto.to)) {
			throw new BadRequestException(ErrorMessages.EMAIL.INVALID_DESTINATION);
		}

		const templateConfig = EMAIL_TEMPLATES[sendMailDto.template];
		if (!templateConfig) {
			throw new BadRequestException(ErrorMessages.EMAIL.TEMPLATE_NOT_FOUND);
		}

		const mailConfig = this.configService.get('mail');
		
		try {
			const mailOptions: nodemailer.SendMailOptions = {
				from: mailConfig.from,
				to: sendMailDto.to,
				subject: sendMailDto.subject || templateConfig.subject,
				html: EMAIL_TEMPLATE_HTML[templateConfig.template](sendMailDto.context || {})
			};

			this.logger.log(`📧 Iniciando envio de email: ${sendMailDto.template} para ${sendMailDto.to}`);

			const info = await this.sendMailWithRetry(mailOptions);
			const entregue = await this.verificarEntrega(info);
			
			await this.logMetrics(entregue, sendMailDto.template, sendMailDto.to);
			
			if (entregue) {
				this.logger.log(`✅ Email ${sendMailDto.template} enviado e entregue para ${sendMailDto.to}`);
			} else {
				this.logger.warn(`⚠️ Email ${sendMailDto.template} enviado mas não confirmado para ${sendMailDto.to}`);
			}
		} catch (error) {
			await this.logMetrics(false, sendMailDto.template, sendMailDto.to);
			this.logger.error(`❌ Erro ao enviar email ${sendMailDto.template}:`, error);
			throw error;
		}
	}

	async sendmailConfirmacao(dto: SendMailConfirmacaoDto): Promise<void> {
		await this.sendMail({
			to: dto.usuario,
			subject: EMAIL_TEMPLATES[EmailTemplate.CONFIRMACAO_CADASTRO].subject,
			template: EmailTemplate.CONFIRMACAO_CADASTRO,
			context: { nome: dto.nome }
		});
	}

	async sendmailRecuperarSenha(dto: SendMailRecuperarSenhaDto): Promise<void> {
		await this.sendMail({
			to: dto.usuario,
			subject: EMAIL_TEMPLATES[EmailTemplate.RECUPERACAO_SENHA].subject,
			template: EmailTemplate.RECUPERACAO_SENHA,
			context: { nome: dto.nome, resetLink: dto.resetLink }
		});
	}

	// Método para compatibilidade com código existente
	async sendmailConfirmacaoLegacy(nome: string, usuario: string): Promise<void> {
		await this.sendmailConfirmacao({ nome, usuario });
	}

	async sendmailRecuperarSenhaLegacy(nome: string, usuario: string, resetLink: string): Promise<void> {
		await this.sendmailRecuperarSenha({ nome, usuario, resetLink });
	}
}

/**
 * Para criar a senha de aplicativo do Gmail, utilize o link abaixo:
 * 
 * https://myaccount.google.com/apppasswords
 * 
 */
import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from 'nodemailer';

@Injectable()
export class SendmailService {
	private readonly transporter: nodemailer.Transporter;
	private readonly logger = new Logger(SendmailService.name);

	constructor(private readonly configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: this.configService.get<string>("MAIL_USER"),
				pass: this.configService.get<string>("MAIL_PASS"),
			},
		});
	}

	async sendmailConfirmacao(nome: string, usuario: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: this.configService.get<string>("MAIL_USER"),
				to: usuario,
				subject: "Confirmação de Cadastro",
				html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bem-vindo(a) ${nome}!</h2>
          <p>Obrigado por se cadastrar em nossa plataforma.</p>
          <p>Se você não se cadastrou em nossa plataforma, por favor ignore este e-mail.</p>
          <p>Atenciosamente,<br/>Equipe de Suporte - Projeto Livraria</p>
        </div>
      `,
			});
			this.logger.log(`E-mail de Confirmação de Cadastro enviado para ${usuario}`);
		} catch (error) {
			this.logger.error("Erro ao enviar E-mail de Confirmação de Cadastro:", error);
			throw error;
		}
	}

	async sendmailRecuperarSenha(nome: string, usuario: string, resetLink: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: this.configService.get<string>("MAIL_USER"),
				to: usuario,
				subject: "Recuperação de Senha",
				html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Olá, ${nome}</h1>
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              <p>Clique no link abaixo para criar uma nova senha:</p>
              <a href="${resetLink}">Redefinir minha senha</a>
              <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
              <p>Este link expira em 1 hora.</p>
              <p>Atenciosamente,<br/>Equipe de Suporte - Projeto Livraria</p>
            </div>
            `,
			});
			this.logger.log(`E-mail de Recuperação de Senha enviado para ${usuario}`);
		} catch (error) {
			this.logger.error("Erro ao enviar o E-mail de Recuperação de Senha:", error);
			throw error;
		}
	}
}


/**
 * Para criar a senha de aplicativo do Gmail, utilize o link abaixo:
 * 
 * https://myaccount.google.com/apppasswords
 * 
 */
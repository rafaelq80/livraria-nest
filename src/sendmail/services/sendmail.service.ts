import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"

@Injectable()
export class SendmailService {
	private transporter: nodemailer.Transporter

	constructor(private configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: this.configService.get<string>("EMAIL_USER"),
				pass: this.configService.get<string>("EMAIL_PASSWORD"),
			},
			tls: {
				// Desativa a verificação do certificado - use apenas em ambiente de desenvolvimento
				rejectUnauthorized: false,
			},
		})

		this.transporter.verify(function (error) {
			if (error) {
				console.error("Erro na conexão com Mailtrap:", error)
			} else {
				console.log("Servidor de e-mail pronto para enviar mensagens")
			}
		})
	}

	async sendmailConfirmacao(nome: string, usuario: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: this.configService.get<string>("EMAIL_USER"),
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
			})
			console.log(`E-mail de Confirmação de Cadastro enviado para ${usuario}`)
		} catch (error) {
			console.error("Erro ao enviar E-mail de Confirmação de Cadastro:", error)
		}
	}

	async sendmailRecuperarSenha(nome: string, usuario: string, resetLink: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: this.configService.get<string>("EMAIL_USER"),
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
			})
			console.log(`E-mail de Recuperação de Senha enviado para ${usuario}`)
		} catch (error) {
			console.error("Erro ao enviar o E-mail de Recuperação de Senha:", error)
		}
	}
}


/**
 * Para criar a senha de aplicativo do Gmail, utilize o link abaixo:
 * 
 * https://myaccount.google.com/apppasswords
 * 
 */
import { EmailTemplate } from '../dto/sendmail.dto';

export interface EmailTemplateConfig {
  subject: string;
  template: string;
}

export const EMAIL_TEMPLATES: Record<EmailTemplate, EmailTemplateConfig> = {
  [EmailTemplate.CONFIRMACAO_CADASTRO]: {
    subject: 'Confirmação de Cadastro',
    template: 'confirmacao-cadastro'
  },
  [EmailTemplate.RECUPERACAO_SENHA]: {
    subject: 'Recuperação de Senha',
    template: 'recuperacao-senha'
  }
};

export const EMAIL_TEMPLATE_HTML = {
  'confirmacao-cadastro': (context: { nome: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎉 Bem-vindo(a) ${context.nome}!</h2>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Obrigado por se cadastrar em nossa plataforma de livraria!
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Agora você tem acesso a milhares de livros e pode gerenciar sua biblioteca pessoal.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
            <strong>⚠️ Importante:</strong> Se você não se cadastrou em nossa plataforma, 
            por favor ignore este e-mail.
          </p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Atenciosamente,<br/>
            <strong>Equipe de Suporte - Projeto Livraria</strong>
          </p>
        </div>
      </div>
    </div>
  `,
  
  'recuperacao-senha': (context: { nome: string; resetLink: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Recuperação de Senha</h2>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Olá, <strong>${context.nome}</strong>!
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Recebemos uma solicitação para redefinir sua senha na plataforma.
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${context.resetLink}" 
             style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            🔑 Redefinir minha senha
          </a>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>⚠️ Importante:</strong> Se você não solicitou a redefinição de senha, 
            ignore este e-mail. Este link expira em <strong>1 hora</strong>.
          </p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            Atenciosamente,<br/>
            <strong>Equipe de Suporte - Projeto Livraria</strong>
          </p>
        </div>
      </div>
    </div>
  `
}; 
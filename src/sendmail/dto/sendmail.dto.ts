import { IsEmail, IsString, IsOptional, IsObject, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EmailTemplate {
  CONFIRMACAO_CADASTRO = 'CONFIRMACAO_CADASTRO',
  RECUPERACAO_SENHA = 'RECUPERACAO_SENHA',
}

export class SendMailDto {
  @ApiProperty({ 
    description: 'Email de destino',
    example: 'usuario@email.com'
  })
  @IsEmail({}, { message: 'Email de destino inválido' })
  to: string;

  @ApiProperty({ 
    description: 'Assunto do email',
    example: 'Confirmação de Cadastro'
  })
  @IsString({ message: 'Assunto deve ser uma string' })
  @MinLength(1, { message: 'Assunto não pode estar vazio' })
  subject: string;

  @ApiProperty({ 
    description: 'Template do email',
    enum: EmailTemplate,
    example: EmailTemplate.CONFIRMACAO_CADASTRO
  })
  @IsEnum(EmailTemplate, { message: 'Template inválido' })
  template: EmailTemplate;

  @ApiProperty({ 
    description: 'Contexto para o template',
    required: false,
    example: { nome: 'João Silva', resetLink: 'https://example.com/reset' }
  })
  @IsOptional()
  @IsObject({ message: 'Contexto deve ser um objeto' })
  context?: Record<string, string | number | boolean>;
}

export class SendMailConfirmacaoDto {
  @ApiProperty({ 
    description: 'Nome do usuário',
    example: 'João Silva'
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(1, { message: 'Nome não pode estar vazio' })
  nome: string;

  @ApiProperty({ 
    description: 'Email do usuário',
    example: 'joao@email.com'
  })
  @IsEmail({}, { message: 'Email inválido' })
  usuario: string;
}

export class SendMailRecuperarSenhaDto {
  @ApiProperty({ 
    description: 'Nome do usuário',
    example: 'João Silva'
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(1, { message: 'Nome não pode estar vazio' })
  nome: string;

  @ApiProperty({ 
    description: 'Email do usuário',
    example: 'joao@email.com'
  })
  @IsEmail({}, { message: 'Email inválido' })
  usuario: string;

  @ApiProperty({ 
    description: 'Link para redefinição de senha',
    example: 'https://example.com/reset?token=abc123'
  })
  @IsString({ message: 'Link de reset deve ser uma string' })
  @MinLength(1, { message: 'Link de reset não pode estar vazio' })
  resetLink: string;
} 
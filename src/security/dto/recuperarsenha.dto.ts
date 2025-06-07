import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, MinLength, Matches, Length } from "class-validator"

export class RecuperarSenhaDto {
	@ApiProperty({ 
		description: 'Token de recuperação de senha',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
	})
	@IsString({ message: 'Token deve ser uma string' })
	@IsNotEmpty({ message: 'Token é obrigatório' })
	@Length(10, 500, { message: 'Token deve ter entre 10 e 500 caracteres' })
	token: string

	@ApiProperty({ 
		description: 'Nova senha',
		example: 'NovaSenha@123'
	})
	@IsString({ message: 'Senha deve ser uma string' })
	@IsNotEmpty({ message: 'Senha é obrigatória' })
	@MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{ message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial' }
	)
	senha: string

	@ApiProperty({ 
		description: 'Confirmação da nova senha',
		example: 'NovaSenha@123'
	})
	@IsString({ message: 'Confirmação de senha deve ser uma string' })
	@IsNotEmpty({ message: 'Confirmação de senha é obrigatória' })
	@MinLength(8, { message: 'Confirmação de senha deve ter no mínimo 8 caracteres' })
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{ message: 'A confirmação de senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial' }
	)
	confirmarSenha: string
}

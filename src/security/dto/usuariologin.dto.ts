import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, IsEmail, MinLength } from "class-validator"

export class UsuarioLoginDto {
	@ApiProperty({ 
		description: 'Email do usuário',
		example: 'usuario@email.com'
	})
	@IsEmail({}, { message: 'Email inválido' })
	@IsNotEmpty({ message: 'Email é obrigatório' })
	public usuario: string

	@ApiProperty({ 
		description: 'Senha do usuário',
		example: 'senha123'
	})
	@IsString({ message: 'Senha deve ser uma string' })
	@IsNotEmpty({ message: 'Senha é obrigatória' })
	@MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
	public senha: string
}

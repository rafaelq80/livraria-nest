import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, Length } from "class-validator"

export class SendmailDto {
	@ApiProperty({ 
		description: 'Email do usuário',
		example: 'usuario@email.com'
	})
	@IsEmail({}, { message: 'Email inválido' })
	@IsNotEmpty({ message: 'Email é obrigatório' })
	@Length(5, 255, { message: 'Email deve ter entre 5 e 255 caracteres' })
	usuario: string
}

import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, MinLength } from "class-validator"

export class RecuperarSenhaDto {

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	token: string

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	senha: string

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	confirmarSenha: string
}

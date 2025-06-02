import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class UsuarioLoginDto {

	@ApiProperty()
	@IsString()
	public usuario: string

	@ApiProperty()
	@IsString()
	public senha: string
}

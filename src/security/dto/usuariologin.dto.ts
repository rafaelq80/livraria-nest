import { ApiProperty } from "@nestjs/swagger"

export class UsuarioLoginDto {

	@ApiProperty()
	public usuario: string

	@ApiProperty()
	public senha: string
}

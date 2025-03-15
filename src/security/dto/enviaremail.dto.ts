import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty } from "class-validator"

export class EnviarEmailDto {

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	usuario: string
  
}

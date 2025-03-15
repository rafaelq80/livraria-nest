import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty } from "class-validator"

export class SendmailDto {

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	usuario: string
  
}

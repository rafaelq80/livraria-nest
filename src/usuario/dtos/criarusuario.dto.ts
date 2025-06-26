import { ApiProperty } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import {
  ArrayMinSize,
  IsEmail,
  IsNumber,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateNested
} from "class-validator"

// DTO Auxiliar
export class RoleIdDto {
	@IsNumber()
	id: number
}

export class CriarUsuarioDto {
	@ApiProperty({
		description: "Nome completo do usuário",
		example: "João da Silva",
	})
	@IsString({ message: "Nome deve ser uma string" })
	@Length(2, 255, { message: "Nome deve ter entre 2 e 255 caracteres" })
	nome: string

	@ApiProperty({
		description: "Email do usuário",
		example: "joao@email.com",
	})
	@IsEmail({}, { message: "Email inválido" })
	usuario: string

	@ApiProperty({
		description: "Senha do usuário",
		example: "Senha@123",
	})
	@IsString({ message: "Senha deve ser uma string" })
	@MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
		message:
			"A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial",
	})
	senha: string

	@ApiProperty({
		description: "Roles do usuário (apenas id)",
		type: [RoleIdDto],
	})
	@ArrayMinSize(1, { message: "Pelo menos uma role é obrigatória" })
	@ValidateNested({ each: true })
	@Transform(({ value }) => (typeof value === "string" ? JSON.parse(value) : value))
	@Type(() => RoleIdDto)
	roles: RoleIdDto[]
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CriarRoleDto {
	@ApiProperty({
		description: 'Nome da role',
		example: 'admin'
	})
	@IsNotEmpty({ message: 'Nome da role é obrigatório' })
	@IsString({ message: 'Nome deve ser uma string' })
	@Length(2, 50, { message: 'Nome deve ter entre 2 e 50 caracteres' })
	nome: string;

	@ApiProperty({
		description: 'Descrição da role',
		example: 'Administrador do sistema'
	})
	@IsNotEmpty({ message: 'Descrição da role é obrigatória' })
	@IsString({ message: 'Descrição deve ser uma string' })
	@Length(2, 255, { message: 'Descrição deve ter entre 2 e 255 caracteres' })
	descricao: string;
} 
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CriarAutorDto {
	@ApiProperty({
		description: 'Nome completo do autor',
		example: 'Machado de Assis'
	})
	@IsNotEmpty({ message: 'Nome do autor é obrigatório' })
	@Length(2, 255, { message: 'Nome deve ter entre 2 e 255 caracteres' })
	@IsString({ message: 'Nome deve ser uma string' })
	nome: string;

	@ApiProperty({
		description: 'Nacionalidade do autor',
		example: 'Brasileira',
		required: false
	})
	@IsOptional()
	@IsString({ message: 'Nacionalidade deve ser uma string' })
	nacionalidade?: string;
} 

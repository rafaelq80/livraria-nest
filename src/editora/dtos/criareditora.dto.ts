import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CriarEditoraDto {
	@ApiProperty({
		description: 'Nome da editora',
		example: 'Companhia das Letras'
	})
	@IsNotEmpty({ message: 'Nome da editora é obrigatório' })
	@Length(2, 100, { message: 'Nome deve ter entre 2 e 100 caracteres' })
	@IsString({ message: 'Nome deve ser uma string' })
	nome: string;
} 
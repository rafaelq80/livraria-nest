import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CriarCategoriaDto {
	@ApiProperty({
		description: 'Tipo da categoria',
		example: 'Literatura'
	})
	@IsNotEmpty({ message: 'Tipo da categoria é obrigatório' })
	@Length(2, 100, { message: 'Tipo deve ter entre 2 e 100 caracteres' })
	@IsString({ message: 'Tipo deve ser uma string' })
	tipo: string;
} 
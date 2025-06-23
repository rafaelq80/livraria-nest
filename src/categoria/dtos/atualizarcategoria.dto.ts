import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsNotEmpty } from "class-validator";
import { CriarCategoriaDto } from "./criarcategoria.dto";

export class AtualizarCategoriaDto extends CriarCategoriaDto {
	@ApiProperty({
		description: 'ID da categoria',
		example: 1
	})
	@IsNumber({}, { message: 'ID deve ser um número' })
	@IsNotEmpty({ message: 'ID é obrigatório' })
	@Type(() => Number)
	id: number;
} 
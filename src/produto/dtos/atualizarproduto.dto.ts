import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber } from "class-validator"
import { CriarProdutoDto } from "./criarproduto.dto"
import { Type } from "class-transformer"

export class AtualizarProdutoDto extends CriarProdutoDto {
	@ApiProperty({ 
		description: 'ID do produto',
		example: 1
	})
	@IsNumber({}, { message: 'ID deve ser um número' })
	@IsNotEmpty({ message: 'ID é obrigatório' })
	@Type(() => Number)
	id: number
} 
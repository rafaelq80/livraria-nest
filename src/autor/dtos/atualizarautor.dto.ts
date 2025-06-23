import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsNotEmpty } from "class-validator";
import { CriarAutorDto } from "./criarautor.dto";


export class AtualizarAutorDto extends CriarAutorDto {
	@ApiProperty({ 
		description: 'ID do autor',
		example: 1
	})
	@IsNumber({}, { message: 'ID deve ser um número' })
	@IsNotEmpty({ message: 'ID é obrigatório' })
	@Type(() => Number)
	id: number

}
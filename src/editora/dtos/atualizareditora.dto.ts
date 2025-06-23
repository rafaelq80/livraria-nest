import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsNotEmpty } from "class-validator";
import { CriarEditoraDto } from "./criareditora.dto";

export class AtualizarEditoraDto extends CriarEditoraDto {
	@ApiProperty({
		description: 'ID da editora',
		example: 1
	})
	@IsNumber({}, { message: 'ID deve ser um número' })
	@IsNotEmpty({ message: 'ID é obrigatório' })
	@Type(() => Number)
	id: number;
} 
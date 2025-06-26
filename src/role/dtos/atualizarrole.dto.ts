import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsNotEmpty } from "class-validator";
import { CriarRoleDto } from "./criarrole.dto";

export class AtualizarRoleDto extends CriarRoleDto {
	@ApiProperty({
		description: 'ID da role',
		example: 1
	})
	@IsNumber({}, { message: 'ID deve ser um número' })
	@IsNotEmpty({ message: 'ID é obrigatório' })
	@Type(() => Number)
	id: number;
} 
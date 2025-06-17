import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CriarUsuarioDto } from './criarusuario.dto';

export class AtualizarUsuarioDto extends CriarUsuarioDto {
  @ApiProperty({ 
    description: 'ID do usuário',
    example: 1
  })
  @IsNumber({}, { message: 'ID deve ser um número' })
  @IsNotEmpty({ message: 'ID é obrigatório' })
  @Type(() => Number)
  id: number;

}
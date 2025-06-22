import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO para upload simples de imagem
export class ImageUploadDto {
  @ApiProperty({ 
    description: 'Arquivo de imagem',
    type: 'string',
    format: 'binary'
  })
  @IsNotEmpty({ message: 'Arquivo é obrigatório' })
  file: Express.Multer.File;

  @ApiProperty({ 
    description: 'Tipo de recurso (ex: usuario, produto, autor)',
    example: 'usuario'
  })
  @IsNotEmpty({ message: 'Recurso é obrigatório' })
  @IsString({ message: 'Recurso deve ser uma string' })
  @Length(2, 50, { message: 'Recurso deve ter entre 2 e 50 caracteres' })
  @Matches(/^[a-z]+$/, { message: 'Recurso deve conter apenas letras minúsculas' })
  recurso: string;

  @ApiProperty({ 
    description: 'Identificador do recurso (ex: id do usuário)',
    example: '1'
  })
  @IsNotEmpty({ message: 'Identificador é obrigatório' })
  @IsString({ message: 'Identificador deve ser uma string' })
  @Length(1, 50, { message: 'Identificador deve ter entre 1 e 50 caracteres' })
  @Matches(/^[a-zA-Z0-9-_]+$/, { message: 'Identificador deve conter apenas letras, números, hífen e underscore' })
  identificador: string;
} 
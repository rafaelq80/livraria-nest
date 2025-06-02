import { IsString, IsEmail, MinLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RoleIdDto {
  @IsOptional()
  @Type(() => Number)
  id: number;
}

export class CriarUsuarioDto {
  @IsString()
  nome: string;

  @IsEmail()
  usuario: string;

  @IsString()
  @MinLength(6)
  senha: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleIdDto)
  roles?: RoleIdDto[];
}
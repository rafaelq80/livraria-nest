import { ApiProperty } from '@nestjs/swagger';
import { ImagekitDto } from './imagekit.dto';

// DTO específico para usuário
export class UsuarioImageDto extends ImagekitDto {
  @ApiProperty({ 
    description: 'Tipo de recurso',
    example: 'usuario',
    default: 'usuario'
  })
  recurso: string = 'usuario';
} 
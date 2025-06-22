import { ApiProperty } from '@nestjs/swagger';
import { ImagekitDto } from './imagekit.dto';

// DTO específico para editora
export class EditoraImageDto extends ImagekitDto {
  @ApiProperty({ 
    description: 'Tipo de recurso',
    example: 'editora',
    default: 'editora'
  })
  recurso: string = 'editora';
} 
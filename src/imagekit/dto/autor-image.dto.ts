import { ApiProperty } from '@nestjs/swagger';
import { ImagekitDto } from './imagekit.dto';

// DTO específico para autor
export class AutorImageDto extends ImagekitDto {
  @ApiProperty({ 
    description: 'Tipo de recurso',
    example: 'autor',
    default: 'autor'
  })
  recurso: string = 'autor';
} 
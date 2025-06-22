import { ApiProperty } from '@nestjs/swagger';
import { ImagekitDto } from './imagekit.dto';

// DTO específico para produto
export class ProdutoImageDto extends ImagekitDto {
  @ApiProperty({ 
    description: 'Tipo de recurso',
    example: 'produto',
    default: 'produto'
  })
  recurso: string = 'produto';
} 
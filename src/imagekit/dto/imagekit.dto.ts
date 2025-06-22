import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImageUploadDto } from './image-upload.dto';

// DTO para atualização de imagem (com URL antiga)
export class ImagekitDto extends ImageUploadDto {
  @ApiProperty({ 
    description: 'URL da imagem antiga (para atualização)',
    example: 'https://example.com/old-image.jpg',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'URL da imagem antiga deve ser uma string' })
  @Length(5, 5000, { message: 'URL da imagem antiga deve ter entre 5 e 5000 caracteres' })
  @Matches(
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9]{1,6}\b([-a-zA-Z0-9@:%_+~#?&/=]*)$/,
    { message: 'URL da imagem antiga inválida' }
  )
  oldImageUrl?: string;
}

// Interface para a resposta do ImageKit
export interface ImagekitResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  path: string;
  size: number;
  filePath: string;
  tags: string[];
  isPrivateFile: boolean;
  customCoordinates: string | null;
  fileType: string;
}

// Função helper para criar DTO com validações
export function createImagekitDto(
  file: Express.Multer.File | undefined,
  recurso: string | undefined,
  identificador: string | undefined,
  oldImageUrl?: string
): ImagekitDto {
  if (!file) {
    throw new Error('Arquivo é obrigatório para criar ImagekitDto');
  }

  if (!recurso || typeof recurso !== 'string' || recurso.trim() === '') {
    throw new Error('Recurso é obrigatório e deve ser uma string não vazia');
  }

  if (!identificador || typeof identificador !== 'string' || identificador.trim() === '') {
    throw new Error('Identificador é obrigatório e deve ser uma string não vazia');
  }

  return {
    file,
    recurso: recurso.trim(),
    identificador: identificador.trim(),
    oldImageUrl: oldImageUrl?.trim() || undefined,
  };
}

// Função para validar arquivo de imagem
export function validateImageFile(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new Error('Arquivo não fornecido');
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new Error('Buffer do arquivo está vazio');
  }

  if (!file.mimetype) {
    throw new Error('Tipo MIME do arquivo não identificado');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`);
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo excede o tamanho máximo de 5MB');
  }
}
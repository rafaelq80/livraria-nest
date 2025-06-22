import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorMessages } from '../../common/constants/error-messages';
import { loadImage } from 'canvas';

export interface ImageValidationResult {
  isValid: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  fileSize: number;
  mimeType: string;
  errors: string[];
}

export interface ImageValidationConfig {
  maxFileSize: number;
  allowedTypes: string[];
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minAspectRatio: number;
  maxAspectRatio: number;
}

@Injectable()
export class ImageValidationService {
  private readonly config: ImageValidationConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      maxFileSize: this.configService.get<number>('imagekit.maxFileSize'),
      allowedTypes: this.configService.get<string[]>('imagekit.allowedTypes'),
      minWidth: this.configService.get<number>('imagekit.minWidth'),
      maxWidth: this.configService.get<number>('imagekit.maxWidth'),
      minHeight: this.configService.get<number>('imagekit.minHeight'),
      maxHeight: this.configService.get<number>('imagekit.maxHeight'),
      minAspectRatio: this.configService.get<number>('imagekit.minAspectRatio'),
      maxAspectRatio: this.configService.get<number>('imagekit.maxAspectRatio'),
    };
  }

  /**
   * Validação completa de imagem
   */
  async validateImage(file: Express.Multer.File): Promise<ImageValidationResult> {
    const errors: string[] = [];

    // Validação básica do arquivo
    if (!file) {
      throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED);
    }

    // Validação de tamanho
    if (!file.size || file.size > this.config.maxFileSize) {
      errors.push(`Tamanho máximo permitido: ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Validação de tipo MIME
    if (!file.mimetype || !this.config.allowedTypes.includes(file.mimetype)) {
      errors.push(`Formatos permitidos: ${this.config.allowedTypes.join(', ')}`);
    }

    // Validação de buffer
    if (!file.buffer || file.buffer.length === 0) {
      errors.push('Arquivo corrompido ou vazio');
    }

    // Se há erros básicos, retorna sem processar a imagem
    if (errors.length > 0) {
      return {
        isValid: false,
        width: 0,
        height: 0,
        aspectRatio: 0,
        fileSize: file.size || 0,
        mimeType: file.mimetype || 'unknown',
        errors,
      };
    }

    try {
      // Carrega a imagem para análise
      const image = await loadImage(file.buffer);
      const width = image.width;
      const height = image.height;
      const aspectRatio = width / height;

      // Validação de dimensões
      if (width < this.config.minWidth) {
        errors.push(`Largura mínima: ${this.config.minWidth}px`);
      }

      if (width > this.config.maxWidth) {
        errors.push(`Largura máxima: ${this.config.maxWidth}px`);
      }

      if (height < this.config.minHeight) {
        errors.push(`Altura mínima: ${this.config.minHeight}px`);
      }

      if (height > this.config.maxHeight) {
        errors.push(`Altura máxima: ${this.config.maxHeight}px`);
      }

      // Validação de proporção
      if (aspectRatio < this.config.minAspectRatio) {
        errors.push(`Proporção muito baixa. Mínima: ${this.config.minAspectRatio}`);
      }

      if (aspectRatio > this.config.maxAspectRatio) {
        errors.push(`Proporção muito alta. Máxima: ${this.config.maxAspectRatio}`);
      }

      // Validação de área total
      const totalPixels = width * height;
      const maxPixels = this.config.maxWidth * this.config.maxHeight;
      if (totalPixels > maxPixels) {
        errors.push(`Área total muito grande. Máxima: ${this.formatNumber(maxPixels)} pixels`);
      }

      return {
        isValid: errors.length === 0,
        width,
        height,
        aspectRatio,
        fileSize: file.size,
        mimeType: file.mimetype,
        errors,
      };
    } catch (error) {
      console.error('Erro ao validar imagem:', error);
      errors.push('Imagem corrompida ou formato inválido');
      return {
        isValid: false,
        width: 0,
        height: 0,
        aspectRatio: 0,
        fileSize: file.size,
        mimeType: file.mimetype || 'unknown',
        errors,
      };
    }
  }

  /**
   * Validação rápida (sem carregar a imagem)
   */
  validateImageBasic(file: Express.Multer.File): ImageValidationResult {
    const errors: string[] = [];

    if (!file) {
      throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED);
    }

    // Validação de tamanho
    if (!file.size || file.size > this.config.maxFileSize) {
      errors.push(`Tamanho máximo permitido: ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Validação de tipo MIME
    if (!file.mimetype || !this.config.allowedTypes.includes(file.mimetype)) {
      errors.push(`Formatos permitidos: ${this.config.allowedTypes.join(', ')}`);
    }

    // Validação de buffer
    if (!file.buffer || file.buffer.length === 0) {
      errors.push('Arquivo corrompido ou vazio');
    }

    return {
      isValid: errors.length === 0,
      width: 0,
      height: 0,
      aspectRatio: 0,
      fileSize: file.size || 0,
      mimeType: file.mimetype || 'unknown',
      errors,
    };
  }

  /**
   * Verifica se a imagem é quadrada (com tolerância)
   */
  isSquare(width: number, height: number, tolerance: number = 0.1): boolean {
    const aspectRatio = width / height;
    return Math.abs(aspectRatio - 1) <= tolerance;
  }

  /**
   * Verifica se a imagem é retrato
   */
  isPortrait(width: number, height: number): boolean {
    return height > width;
  }

  /**
   * Verifica se a imagem é paisagem
   */
  isLandscape(width: number, height: number): boolean {
    return width > height;
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): ImageValidationConfig {
    return { ...this.config };
  }

  /**
   * Formata tamanho de arquivo para exibição
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formata número para exibição
   */
  private formatNumber(num: number): string {
    return num.toLocaleString();
  }
} 
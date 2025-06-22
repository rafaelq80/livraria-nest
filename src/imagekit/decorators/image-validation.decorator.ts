import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ErrorMessages } from '../../common/constants/error-messages';

export interface ImageValidationOptions {
  required?: boolean;
  validateDimensions?: boolean;
  customValidation?: (file: Express.Multer.File) => Promise<boolean>;
}

export const ValidatedImage = createParamDecorator(
  async (options: ImageValidationOptions, ctx: ExecutionContext) => {
    const opts = options || {};
    const request = ctx.switchToHttp().getRequest();
    const file = request.file;

    // Se não é obrigatório e não há arquivo, retorna undefined
    if (!opts.required && !file) {
      return undefined;
    }

    // Se é obrigatório mas não há arquivo
    if (opts.required && !file) {
      throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED);
    }

    // Se há arquivo, retorna o arquivo (a validação será feita no serviço)
    return file;
  },
); 
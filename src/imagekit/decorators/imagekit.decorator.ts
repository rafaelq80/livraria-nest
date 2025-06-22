import { UseInterceptors } from '@nestjs/common';
import { ImageKitInterceptor } from '../interceptors/imagekit.interceptor';

/**
 * Decorator para aplicar o interceptor do ImageKit
 * Use este decorator em controllers que fazem upload de imagens
 */
export const UseImageKit = () => UseInterceptors(ImageKitInterceptor); 
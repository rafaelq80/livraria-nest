import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class ImageKitInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			catchError(error => {
				// Tratar erros específicos do ImageKit
				if (error.message?.includes('IMAGEKIT')) {
					return throwError(() => new BadRequestException(ErrorMessages.IMAGE.CONFIGURATION_ERROR));
				}

				if (error.message?.includes('network') || error.message?.includes('timeout')) {
					return throwError(() => new InternalServerErrorException(ErrorMessages.IMAGE.NETWORK_ERROR));
				}

				if (error.message?.includes('buffer') || error.message?.includes('corrupt')) {
					return throwError(() => new BadRequestException(ErrorMessages.IMAGE.INVALID_FILE));
				}

				if (error.message?.includes('folder') || error.message?.includes('path')) {
					return throwError(() => new InternalServerErrorException(ErrorMessages.IMAGE.FOLDER_ERROR));
				}

				// Para outros erros, manter o comportamento original
				return throwError(() => error);
			}),
		);
	}
} 
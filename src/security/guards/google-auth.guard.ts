import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
	canActivate(context: ExecutionContext) {
		return super.canActivate(context)
	}

	handleRequest(error: Error, usuario: never, info?: Error & { message?: string }) {
		if (error || !usuario) {
			if (info?.message === "Failed to obtain request token") {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_AUTH_FAILED)
			}

			if (info?.message === "InternalOAuthError") {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_INTERNAL_ERROR)
			}

			throw error || new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_AUTH_FAILED)
		}

		return usuario
	}
}
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {

	canActivate(context: ExecutionContext) {
		return super.canActivate(context)
	}

	handleRequest(error: Error, usuario: never, info: Error & { message?: string }) {
		if (error || !usuario) {
			if (info?.message === "Invalid credentials") {
				throw new UnauthorizedException(ErrorMessages.AUTH.INVALID_CREDENTIALS)
			}

			if (info?.message === "Missing credentials") {
				throw new UnauthorizedException(ErrorMessages.AUTH.MISSING_CREDENTIALS)
			}

			throw new UnauthorizedException(ErrorMessages.AUTH.UNAUTHORIZED)
		}
		return usuario
	}
}

import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
	canActivate(context: ExecutionContext) {
		return super.canActivate(context)
	}

	handleRequest(error: Error, usuario: never, info?: Error & { message?: string }) {
		if (error || !usuario) {
			if (info?.message === "Failed to obtain request token") {
				throw new UnauthorizedException("Falha na autenticação com Google. Tente novamente.")
			}

			if (info?.message === "InternalOAuthError") {
				throw new UnauthorizedException("Erro interno do Google OAuth. Tente novamente.")
			}

			throw error || new UnauthorizedException("Falha na autenticação com Google.")
		}

		return usuario
	}
}
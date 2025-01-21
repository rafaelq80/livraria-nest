import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
	canActivate(context: ExecutionContext) {
		// Adiciona lógica customizada antes da validação padrão
		return super.canActivate(context)
	}

	handleRequest(err: any, user: any, info: any) {
		if (info?.name === "JsonWebTokenError") {
			throw new UnauthorizedException("Token inválido. Por favor, forneça um token válido.")
		}

		if (info?.message === "No auth token") {
			throw new UnauthorizedException(
				"Token de autenticação não enviado. Por favor, envie o token no cabeçalho.",
			)
		}

		if (err || !user) {
			throw err || new UnauthorizedException("Acesso não autorizado.")
		}

		return user
	}
}

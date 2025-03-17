import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {

	canActivate(context: ExecutionContext) {
		return super.canActivate(context)
	}

	handleRequest(error: Error, usuario: any, info: Error & { message?: string }) {
		if (error || !usuario) {
			if (info?.message === "Invalid credentials") {
				throw new UnauthorizedException("Usuário ou senha inválidos!")
			}

			if (info?.message === "Missing credentials") {
				throw new UnauthorizedException(
					"Credenciais ausentes. Por favor, forneça o usuário e senha!",
				)
			}

			throw new UnauthorizedException("Acesso não autorizado.")
		}
		return usuario
	}
}

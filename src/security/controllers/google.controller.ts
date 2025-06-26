import { Controller, Get, UseGuards, Req, Logger } from "@nestjs/common"
import { GoogleAuthGuard } from "../guards/google-auth.guard"
import { SecurityService } from "../services/security.service"
import { ErrorMessages } from "../../common/constants/error-messages"
import { ApiTags, ApiResponse } from "@nestjs/swagger"
import { UsuarioAutenticado } from "../interfaces/usuarioautenticado.interface"
import { Public } from "../decorators/public.decorator"

@ApiTags("Autenticação Google")
@Controller("/auth")
export class GoogleController {
	private readonly logger = new Logger(GoogleController.name)
	constructor(private readonly securityService: SecurityService) {}

	@Get("/google")
	@UseGuards(GoogleAuthGuard)
	@Public()
	@ApiResponse({
		status: 302,
		description: "Redireciona para o login do Google."
	})
	googleAuth(): void {
		this.logger.log("Login via Google!")
	}

	@Get("/google/callback")
	@UseGuards(GoogleAuthGuard)
	@Public()
	@ApiResponse({
		status: 200,
		description: "Login com Google realizado com sucesso.",
		schema: {
			example: {
				status: "success",
				message: "Login com Google realizado com sucesso.",
				data: {
					id: 1,
					nome: "João da Silva",
					usuario: "joao@email.com",
					foto: "https://example.com/foto.jpg",
					roles: [{ nome: "user" }],
					token: "Bearer ..."
				}
			}
		}
	})
	@ApiResponse({
		status: 400,
		description: "Falha na autenticação com Google.",
		schema: {
			example: {
				status: "error",
				message: "Falha na autenticação com Google.",
				data: null
			}
		}
	})
	async googleAuthRedirect(@Req() req: Request & { user: {
		id: number
		nome: string
		usuario: string
		email: string
		foto?: string
		roles: Array<{ nome: string }>
		googleId: string
	}}): Promise<{ status: string; message: string; data: UsuarioAutenticado | null }> {
		try {
			const data = await this.securityService.loginGoogle(req.user.googleId)
			this.logger.log(`Login via Google realizado para o usuário: ${data.usuario} (ID: ${data.id})`)
			return {
				status: "success",
				message: "Login com Google realizado com sucesso.",
				data
			}
		} catch (error) {
			console.error("Erro na autenticação:", error instanceof Error ? error.message : error)
			return {
				status: "error",
				message: ErrorMessages.AUTH.GOOGLE_AUTH_FAILED,
				data: null
			}
		}
	}
}
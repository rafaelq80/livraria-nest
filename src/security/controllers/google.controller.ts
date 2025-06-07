import { Controller, Get, UseGuards, Req, BadRequestException } from "@nestjs/common"
import { GoogleAuthGuard } from "../guards/google-auth.guard"
import { UsuarioAutenticado } from "../interfaces/usuarioautenticado.interface"
import { SecurityService } from "../services/security.service"
import { ErrorMessages } from "../../common/constants/error-messages"

@Controller("/auth")
export class GoogleController {
	constructor(private readonly securityService: SecurityService) {}

	@Get("/google")
	@UseGuards(GoogleAuthGuard)
	async googleAuth(): Promise<void> {	}

	@Get("/google/callback")
	@UseGuards(GoogleAuthGuard)
	async googleAuthRedirect(@Req() req: Request & { user: {
		id: number
		nome: string
		usuario: string
		email: string
		foto?: string
		roles: Array<{ nome: string }>
		googleId: string
	}}): Promise<UsuarioAutenticado> {
		try {
			return await this.securityService.loginGoogle(req.user.googleId)
		} catch (error) {
			console.error("Erro na autenticação:", error instanceof Error ? error.message : error)
			throw new BadRequestException(ErrorMessages.AUTH.GOOGLE_AUTH_FAILED)
		}
	}
}
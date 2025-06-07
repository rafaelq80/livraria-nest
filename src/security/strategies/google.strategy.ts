import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { RoleService } from "../../role/services/role.service"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { Role } from "../../role/entities/role.entity"
import { Bcrypt } from "../bcrypt/bcrypt"
import { OAuth2Client } from "google-auth-library"
import { GoogleProfile } from "../interfaces/google.interface"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
	private readonly googleClient: OAuth2Client

	constructor(
		configService: ConfigService,
		private readonly usuarioService: UsuarioService,
		private readonly roleService: RoleService,
		private readonly bcrypt: Bcrypt,
	) {
		const clientID = configService.getOrThrow<string>("GOOGLE_CLIENT_ID")
		const clientSecret = configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET")
		const callbackURL = configService.getOrThrow<string>("GOOGLE_CALLBACK_URL")

		super({
			clientID,
			clientSecret,
			callbackURL,
			scope: ["email", "profile"],
		})

		this.googleClient = new OAuth2Client(clientID)
	}

	async validate(
		accessToken: string,
		_refreshToken: string,
		profile: Profile,
		done: VerifyCallback,
	): Promise<void> {
		try {
			const { id, displayName, emails, photos } = profile as GoogleProfile

			if (!emails || emails.length === 0) {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_NOT_FOUND)
			}

			const email = emails[0].value

			await this.validateGoogleToken(accessToken, email)
			
			const foto = photos && photos.length > 0 ? photos[0].value : undefined

			// Busca usuário pelo email
			let usuario: Usuario | null = await this.usuarioService.findByUsuario(email)

			if (!usuario) {
				// Cria novo usuário
				const novoUsuario = new Usuario()
				novoUsuario.nome = displayName
				novoUsuario.usuario = email
				novoUsuario.senha = await this.generateRandomPassword()
				novoUsuario.foto = foto
				novoUsuario.googleId = id
				novoUsuario.roles = await this.getDefaultRoles()

				usuario = await this.usuarioService.create(novoUsuario, null)
			} else {
				// Atualiza usuário existente
				let needsUpdate = false
				
				if (!usuario.googleId) {
					usuario.googleId = id
					needsUpdate = true
				}
				
				if (foto && (!usuario.foto || usuario.foto !== foto)) {
					usuario.foto = foto
					needsUpdate = true
				}
				
				if (needsUpdate) {
					await this.usuarioService.update(usuario)
				}
			}

			if (!usuario.roles || usuario.roles.length === 0) {
				throw new UnauthorizedException(ErrorMessages.AUTH.NO_ROLES)
			}

			const usuarioValidado = {
				id: Number(usuario.id),
				nome: usuario.nome,
				usuario: usuario.usuario,
				email: usuario.usuario,
				foto: usuario.foto,
				roles: usuario.roles.map((role) => ({ nome: role.nome })),
				googleId: id,
			}

			done(null, usuarioValidado)
		} catch (error) {
			console.error('Erro na validação Google:', error)
			done(error, false)
		}
	}

	private async generateRandomPassword(): Promise<string> {
		const randomPassword = Math.random().toString(36).substring(2, 15) + 
							  Math.random().toString(36).substring(2, 15)
		return await this.bcrypt.criptografarSenha(randomPassword)
	}

	private async getDefaultRoles(): Promise<Role[]> {
		try {
			const defaultRole = await this.roleService.findByNome("user")
			return defaultRole ? [defaultRole] : []
		} catch {
			return []
		}
	}

	private async validateGoogleToken(accessToken: string, expectedEmail: string): Promise<void> {
		try {
			const response = await fetch(
				`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
				{
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
					},
				}
			)

			if (!response.ok) {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_TOKEN_INVALID)
			}

			const googleUserInfo = await response.json()

			if (!googleUserInfo.email || googleUserInfo.email !== expectedEmail) {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_MISMATCH)
			}

			if (!googleUserInfo.verified_email) {
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_NOT_VERIFIED)
			}

		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error
			}
			console.error('Erro na validação do token Google:', error)
			throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_TOKEN_INVALID)
		}
	}
}
import { Injectable, UnauthorizedException, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { RoleService } from "../../role/services/role.service"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { Role } from "../../role/entities/role.entity"
import { Bcrypt } from "../bcrypt/bcrypt"
import { OAuth2Client } from "google-auth-library"
import { GoogleProfile } from "../interfaces/googleprofile.interface"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
	private readonly googleClient: OAuth2Client
	private readonly logger = new Logger(GoogleStrategy.name)

	constructor(
		configService: ConfigService,
		private readonly usuarioService: UsuarioService,
		private readonly roleService: RoleService,
		private readonly bcrypt: Bcrypt,
	) {
		const clientID = configService.getOrThrow<string>("google.clientId")
		const clientSecret = configService.getOrThrow<string>("google.clientSecret")
		const callbackURL = configService.getOrThrow<string>("google.callbackURL")

		super({
			clientID,
			clientSecret,
			callbackURL,
			scope: ["email", "profile"],
		})

		this.googleClient = new OAuth2Client(clientID)
		this.logger.log('🔐 Google Strategy inicializada com sucesso')
	}

	async validate(
		accessToken: string,
		_refreshToken: string,
		profile: Profile,
		done: VerifyCallback,
	): Promise<void> {
		try {
			this.logger.log(`🔍 Validando usuário Google: ${profile.id}`)
			
			const { id, displayName, emails, photos } = profile as GoogleProfile

			if (!emails || emails.length === 0) {
				this.logger.warn(`❌ Email não encontrado para usuário Google: ${id}`)
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_NOT_FOUND)
			}

			const email = emails[0].value
			this.logger.log(`📧 Email do usuário Google: ${email}`)

			await this.validateGoogleToken(accessToken, email)
			
			const foto = photos && photos.length > 0 ? photos[0].value : undefined

			// Busca usuário pelo email
			let usuario: Usuario | null = await this.usuarioService.findByUsuario(email)

			if (!usuario) {
				this.logger.log(`👤 Criando novo usuário para: ${email}`)
				// Cria novo usuário
				const novoUsuario = new Usuario()
				novoUsuario.nome = displayName
				novoUsuario.usuario = email
				novoUsuario.senha = await this.generateRandomPassword()
				novoUsuario.foto = foto
				novoUsuario.googleId = id
				novoUsuario.roles = await this.getDefaultRoles()

				usuario = await this.usuarioService.create(novoUsuario, null)
				this.logger.log(`✅ Usuário criado com sucesso: ${usuario.id}`)
			} else {
				this.logger.log(`👤 Usuário existente encontrado: ${usuario.id}`)
				// Atualiza usuário existente
				let needsUpdate = false
				
				if (!usuario.googleId) {
					usuario.googleId = id
					needsUpdate = true
					this.logger.log(`🔗 Google ID vinculado ao usuário: ${usuario.id}`)
				}
				
				if (foto && (!usuario.foto || usuario.foto !== foto)) {
					usuario.foto = foto
					needsUpdate = true
					this.logger.log(`📸 Foto atualizada para usuário: ${usuario.id}`)
				}
				
				if (needsUpdate) {
					await this.usuarioService.update(usuario)
					this.logger.log(`✅ Usuário atualizado: ${usuario.id}`)
				}
			}

			if (!usuario.roles || usuario.roles.length === 0) {
				this.logger.warn(`❌ Usuário sem roles: ${usuario.id}`)
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

			this.logger.log(`✅ Usuário Google validado com sucesso: ${usuario.id}`)
			done(null, usuarioValidado)
		} catch (error) {
			this.logger.error(`❌ Erro na validação Google para ${profile.id}:`, error.message)
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
		} catch (error) {
			this.logger.warn('⚠️ Erro ao obter role padrão:', error.message)
			return []
		}
	}

	private async validateGoogleToken(accessToken: string, expectedEmail: string): Promise<void> {
		try {
			this.logger.log(`🔐 Validando token Google para: ${expectedEmail}`)
			
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
				this.logger.warn(`❌ Token Google inválido para: ${expectedEmail}`)
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_TOKEN_INVALID)
			}

			const googleUserInfo = await response.json()

			if (!googleUserInfo.email || googleUserInfo.email !== expectedEmail) {
				this.logger.warn(`❌ Email não confere: esperado ${expectedEmail}, recebido ${googleUserInfo.email}`)
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_MISMATCH)
			}

			if (!googleUserInfo.verified_email) {
				this.logger.warn(`❌ Email não verificado: ${expectedEmail}`)
				throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_EMAIL_NOT_VERIFIED)
			}

			this.logger.log(`✅ Token Google validado com sucesso para: ${expectedEmail}`)

		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error
			}
			this.logger.error(`❌ Erro na validação do token Google para ${expectedEmail}:`, error.message)
			throw new UnauthorizedException(ErrorMessages.AUTH.GOOGLE_TOKEN_INVALID)
		}
	}
}
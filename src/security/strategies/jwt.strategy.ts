import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { JwtPayload } from "../types/jwtpayload"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly usuarioService: UsuarioService,
	) {
		const jwtSecret = configService.getOrThrow<string>("JWT_SECRET")

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
			algorithms: ["HS256"],
		})
	}

	async validate(payload: JwtPayload): Promise<UsuarioValidado> {
		
		if (!payload?.sub) throw new UnauthorizedException("Payload Inválido")

		const buscaUsuario = await this.usuarioService.findByUsuario(payload.sub)

		if (!buscaUsuario) {
			throw new UnauthorizedException("Usuário não encontrado")
		}

		if (!buscaUsuario.roles || buscaUsuario.roles.length === 0) {
			throw new UnauthorizedException("Usuário sem roles definidas")
		}

		return {
			sub: payload.sub,
			roles: buscaUsuario.roles.map((role) => role.nome),
		}
		
	}
}

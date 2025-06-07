import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { JwtPayload } from "../interfaces/jwtpayload.interface"
import { ErrorMessages } from "../../common/constants/error-messages"

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
		if (!payload?.sub) throw new UnauthorizedException(ErrorMessages.AUTH.INVALID_PAYLOAD)

		const buscaUsuario = await this.usuarioService.findByUsuario(payload.sub)

		if (!buscaUsuario) {
			throw new UnauthorizedException(ErrorMessages.USER.NOT_FOUND)
		}

		if (!buscaUsuario.roles || buscaUsuario.roles.length === 0) {
			throw new UnauthorizedException(ErrorMessages.AUTH.NO_ROLES)
		}

		return {
			sub: payload.sub,
			roles: buscaUsuario.roles.map((role) => role.nome),
		}
	}
}

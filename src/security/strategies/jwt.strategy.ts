import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { Algorithm } from "jsonwebtoken"
import { UsuarioService } from "../../usuario/services/usuario.service"
import { JwtPayload } from "../interfaces/jwtpayload.interface"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly usuarioService: UsuarioService,
	) {
		const jwtSecret = configService.getOrThrow<string>("jwt.secret")
		const jwtAlgorithm = (configService.get<string>("jwt.algorithm") || "HS256") as Algorithm

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
			algorithms: [jwtAlgorithm],
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

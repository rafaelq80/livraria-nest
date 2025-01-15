import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		
		const jwtSecret = configService.getOrThrow<string>("JWT_SECRET")

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
			algorithms: ["HS256"],
		})
	}

	async validate(payload: JwtPayload): Promise<Omit<JwtPayload, "iat" | "exp">> {
		
		if (!payload?.sub) 
			throw new UnauthorizedException("Payload Inválido")
		

		return { sub: payload.sub }
	}
}

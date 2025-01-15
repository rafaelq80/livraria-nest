import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'], 
      passReqToCallback: false,
    });

    if (!this.configService.get<string>('JWT_SECRET')) {
      throw new Error('JWT_SECRET não foi definida nas variáveis de ambiente');
    }

  }

  async validate(payload: JwtPayload): Promise<Omit<JwtPayload, 'iat' | 'exp'>> {
    try {

      if (!payload.sub) {
        throw new UnauthorizedException('Payload Inválido');
      }
      
      return {
        sub: payload.sub,
      };

    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Falha na Validação do Token'
      );
    }
  }
}
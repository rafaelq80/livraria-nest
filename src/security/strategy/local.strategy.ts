import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { SecurityService } from "../services/security.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private securityService: SecurityService) {
        super({
            usernameField: 'usuario',
            passwordField: 'senha',
            passReqToCallback: false,
            session: false,
        })
    }

    async validate(username: string, password: string): Promise<UsuarioAutenticado> {
        try {

            if (!username || !password) {
              throw new UnauthorizedException('Credenciais incompletas');
            }
      
            username = username.trim().toLowerCase();

            const usuario = await this.securityService.validateUser(username, password);

            if(!usuario){
                throw new UnauthorizedException();
            }
        
        return usuario as UsuarioAutenticado;

    } catch (error) {
        throw new UnauthorizedException('Erro na autenticação');
      }
    }
}
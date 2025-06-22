import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class RolesAuthGuard implements CanActivate {
  private readonly logger = new Logger(RolesAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Sem roles específicas, acesso permitido
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      this.logger.warn('❌ Usuário não autenticado tentando acessar recurso protegido');
      throw new HttpException(ErrorMessages.AUTH.USER_NOT_AUTHENTICATED, HttpStatus.UNAUTHORIZED);
    }

    if (!user.roles) {
      this.logger.warn(`❌ Usuário ${user.usuario ?? user.id} sem roles tentando acessar recurso protegido`);
      throw new HttpException(ErrorMessages.AUTH.NO_ROLES, HttpStatus.FORBIDDEN);
    }

    // Verifica se o usuário possui pelo menos uma das roles necessárias (por nome)
    const userRoleNames = Array.isArray(user.roles)
      ? user.roles.map((r: unknown) => {
          if (typeof r === 'string') return r;
          if (typeof r === 'object' && r && 'nome' in r) return (r as { nome: string }).nome;
          return '';
        }).filter(role => role !== '') // Remove roles vazias
      : [];

    if (userRoleNames.length === 0) {
      this.logger.warn(`❌ Usuário ${user.usuario ?? user.id} com roles inválidas`);
      throw new HttpException(ErrorMessages.AUTH.NO_ROLES, HttpStatus.FORBIDDEN);
    }

    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      this.logger.warn(`❌ Usuário ${user.usuario ?? user.id} sem permissão. Roles necessárias: ${requiredRoles.join(', ')}. Roles do usuário: ${userRoleNames.join(', ')}`);
      throw new HttpException(ErrorMessages.AUTH.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN);
    }

    this.logger.log(`✅ Usuário ${user.usuario ?? user.id} autorizado com roles: ${userRoleNames.join(', ')}`);
    return true;
  }
}

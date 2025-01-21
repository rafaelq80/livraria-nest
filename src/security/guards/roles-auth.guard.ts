import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';


@Injectable()
export class RolesAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Sem roles específicas, acesso permitido
    }

    // Mantert o nome da const com o user
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new HttpException("Você não tem permissão de acesso!", HttpStatus.FORBIDDEN)
    }

    // Verifica se o usuário possui pelos menos uma das roles necessárias
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new HttpException("Você não tem permissão de acesso!", HttpStatus.FORBIDDEN)
    }

    return true;
  }
}

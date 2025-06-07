import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    const publicRoutes = [
      '/auth/google',
      '/auth/google/callback',
      '/usuarios/logar',
      '/usuarios/recuperarsenha',
      '/usuarios/atualizarsenha'
    ];
    
    const isPublic = publicRoutes.some(route => 
      request.url.startsWith(route)
    );
    
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
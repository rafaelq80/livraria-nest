import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../../usuario/services/usuario.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Bcrypt } from '../bcrypt/bcrypt';
import { UsuarioLogin } from '../entities/usuariologin.entity';

@Injectable()
export class SecurityService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private bcrypt: Bcrypt,
  ) {}

  async validateUser(username: string, password: string,): Promise<Omit<any, 'senha'> | null> {
    try {
      if (!username || !password) {
        throw new HttpException(
          'Usuário e Senha são Obrigatórios!',
          HttpStatus.BAD_REQUEST,
        );
      }

      const buscaUsuario = await this.usuarioService.findByUsuario(username);

      if (!buscaUsuario)
        throw new HttpException(
          'Usuário não encontrado!',
          HttpStatus.NOT_FOUND,
        );

      const validaSenha = await this.bcrypt.compararSenhas(
        password,
        buscaUsuario.senha,
      );

      if (!validaSenha)
        throw new HttpException('Senha incorreta!', HttpStatus.UNAUTHORIZED);

      const { senha, ...dadosUsuario } = buscaUsuario;

      return dadosUsuario;

    } catch (error: any) {
      return null;
    }
  }

  async login(usuarioLogin: UsuarioLogin): Promise<UsuarioAutenticado> {
    try {

        const buscaUsuario = await this.usuarioService.findByUsuario(
            usuarioLogin.usuario,
        );

        const payload: JwtPayload = {
            sub: usuarioLogin.usuario
        };

        return {
            id: buscaUsuario.id,
            nome: buscaUsuario.nome,
            usuario: usuarioLogin.usuario,
            foto: buscaUsuario.foto,
            token: `Bearer ${this.jwtService.sign(payload)}`,
        };

    } catch (error: any) {
        console.log(error)
        throw new HttpException(
            'Erro ao efetuar login',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }
}

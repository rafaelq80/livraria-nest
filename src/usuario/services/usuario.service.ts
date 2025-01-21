import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bcrypt } from '../../security/bcrypt/bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { RoleService } from '../../role/services/role.service';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private readonly roleService: RoleService,
    private bcrypt: Bcrypt,
  ) {}

  async findByUsuario(usuario: string): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      where: { usuario },
      relations: {
        roles: true,
      },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      relations: {
        roles: true,
      },
    });
  }

  async findById(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: {
        roles: true,
      },
    });

    if (!usuario)
      throw new HttpException('Usuario não encontrado!', HttpStatus.NOT_FOUND);

    return usuario;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    
    if (await this.findByUsuario(usuario.usuario)) {
      throw new HttpException('O Usuario ja existe!', HttpStatus.BAD_REQUEST);
    }

    await this.validateRoles(usuario.roles);

    usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha);

    return await this.usuarioRepository.save(usuario);
  }

  async update(usuario: Usuario): Promise<Usuario> {

    await this.findById(usuario.id);

    const buscaUsuario = await this.findByUsuario(usuario.usuario);

    if (buscaUsuario && buscaUsuario.id !== usuario.id ) {
      throw new HttpException(
        'Usuário (e-mail) já Cadastrado!',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.validateRoles(usuario.roles);
    
    usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha);

    return await this.usuarioRepository.save(usuario);

  }

  private async validateRoles(roles: any[]): Promise<void> {
    if (!roles || !Array.isArray(roles)) {
      throw new HttpException(
        'Lista de roles inválida',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const role of roles) {
      try {
        await this.roleService.findById(role.id);
      } catch (error) {
        throw new HttpException(
          `Autor com ID ${role.id} não encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bcrypt } from '../../security/bcrypt/bcrypt';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private bcrypt: Bcrypt,
  ) {}

  async findByUsuario(usuario: string): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      where: { usuario },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  async findById(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
    });

    if (!usuario)
      throw new HttpException('Usuario não encontrado!', HttpStatus.NOT_FOUND);

    return usuario;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    
    if (await this.findByUsuario(usuario.usuario)) {
      throw new HttpException('O Usuario ja existe!', HttpStatus.BAD_REQUEST);
    }

    usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha);

    return await this.usuarioRepository.save(usuario);
  }

  async update(usuario: Usuario): Promise<Usuario> {

    const usuarioDatabase = await this.findById(usuario.id);
    const buscaUsuario = await this.findByUsuario(usuario.usuario);

    if (buscaUsuario && usuarioDatabase.id.toString() !== usuario.id.toString()
    ) {
      throw new HttpException(
        'Usuário (e-mail) já Cadastrado!',
        HttpStatus.BAD_REQUEST,
      );
    }

    usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha);

    return await this.usuarioRepository.save(usuario);

  }

}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, ILike, Repository } from 'typeorm';
import { Autor } from '../entities/autor.entity';

@Injectable()
export class AutorService {
  constructor(
    @InjectRepository(Autor)
    private autorRepository: Repository<Autor>,
  ) {}

  async findAll(): Promise<Autor[]> {
    return await this.autorRepository.find({
      relations: {
        produtos: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Autor> {

    if (id <= 0)
        throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    const autor = await this.autorRepository.findOne({
      where: {
        id,
      },
      relations: {
        produtos: true,
      },
    });

    if (!autor)
      throw new HttpException('Autor não encontrado!', HttpStatus.NOT_FOUND);

    return autor;
  }

  async findByNome(nome: string): Promise<Autor[]> {
    return await this.autorRepository.find({
      where: {
        nome: ILike(`%${nome.trim()}%`),
      },
      relations: {
        produtos: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async create(autor: Autor): Promise<Autor> {

    if (!autor)
        throw new HttpException('Dados do autor inválidos', HttpStatus.BAD_REQUEST);

    return await this.autorRepository.save(autor);
  }

  async update(autor: Autor): Promise<Autor> {
    
    if (!autor || !autor.id)
      throw new HttpException('Autor inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(autor.id);

    return await this.autorRepository.save(autor);
    
  }

  async delete(id: number): Promise<DeleteResult> {

    if (id <= 0)
        throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(id);

    return await this.autorRepository.delete(id);
  }
}

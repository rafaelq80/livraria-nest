import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, ILike, Repository } from 'typeorm';
import { Categoria } from '../entities/categoria.entity';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(): Promise<Categoria[]> {
    return await this.categoriaRepository.find({
      relations: {
        produto: true,
      },
      order: {
        tipo: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Categoria> {
    if (id <= 0)
      throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    const categoria = await this.categoriaRepository.findOne({
      where: {
        id,
      },
      relations: {
        produto: true,
      },
    });

    if (!categoria)
      throw new HttpException(
        'Categoria não encontrada!',
        HttpStatus.NOT_FOUND,
      );

    return categoria;
  }

  async findByTipo(tipo: string): Promise<Categoria[]> {
    return await this.categoriaRepository.find({
      where: {
        tipo: ILike(`%${tipo.trim()}%`),
      },
      relations: {
        produto: true,
      },
      order: {
        tipo: 'ASC',
      },
    });
  }

  async create(categoria: Categoria): Promise<Categoria> {
    if (!categoria)
      throw new HttpException(
        'Dados do autor inválidos',
        HttpStatus.BAD_REQUEST,
      );

    return await this.categoriaRepository.save(categoria);
  }

  async update(categoria: Categoria): Promise<Categoria> {
    if (!categoria || !categoria.id)
      throw new HttpException(
        'Dados da categoria inválidos',
        HttpStatus.BAD_REQUEST,
      );

    await this.findById(categoria.id);

    return await this.categoriaRepository.save(categoria);
  }

  async delete(id: number): Promise<DeleteResult> {
    if (id <= 0)
      throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(id);

    return await this.categoriaRepository.delete(id);
  }
}

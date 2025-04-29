import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, ILike, Repository } from 'typeorm';
import { Editora } from '../entities/editora.entity';

@Injectable()
export class EditoraService {
  constructor(
    @InjectRepository(Editora)
    private readonly editoraRepository: Repository<Editora>,
  ) {}

  async findAll(): Promise<Editora[]> {
    return await this.editoraRepository.find({
      relations: {
        produto: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Editora> {

    if (id <= 0)
        throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    const editora = await this.editoraRepository.findOne({
      where: {
        id,
      },
      relations: {
        produto: true,
      },
    });

    if (!editora)
      throw new HttpException('Editora não encontrado!', HttpStatus.NOT_FOUND);

    return editora;
  }

  async findByNome(nome: string): Promise<Editora[]> {
    return await this.editoraRepository.find({
      where: {
        nome: ILike(`%${nome.trim()}%`),
      },
      relations: {
        produto: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async create(editora: Editora): Promise<Editora> {

    if (!editora)
        throw new HttpException('Dados do editora inválidos', HttpStatus.BAD_REQUEST);

    return await this.editoraRepository.save(editora);
  }

  async update(editora: Editora): Promise<Editora> {
    
    if (!editora?.id)
      throw new HttpException('Editora inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(editora.id);

    return await this.editoraRepository.save(editora);
    
  }

  async delete(id: number): Promise<DeleteResult> {

    if (id <= 0)
        throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(id);

    return await this.editoraRepository.delete(id);
  }
}

import { EditoraService } from './../../editora/services/editora.service';
import { CategoriaService } from './../../categoria/services/categoria.service';
import { AutorService } from './../../autor/services/autor.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Produto } from '../entities/produto.entity';
import { DeleteResult, ILike, Repository } from 'typeorm';

@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    private autorService: AutorService,
    private categoriaService: CategoriaService,
    private editoraService: EditoraService,
  ) {}

  async findAll(): Promise<Produto[]> {
    return await this.produtoRepository.find({
      relations: {
        autores: true,
        categoria: true,
        editora: true,
      },
      order: {
        titulo: 'ASC',
      },
      cache: true,
    });
  }

  async findById(id: number): Promise<Produto> {
    if (id <= 0)
      throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    const produto = await this.produtoRepository.findOne({
      where: {
        id,
      },
      relations: {
        autores: true,
        categoria: true,
        editora: true,
      },
    });

    if (!produto)
      throw new HttpException('Produto não encontrado!', HttpStatus.NOT_FOUND);

    return produto;
  }

  async findByTitulo(titulo: string): Promise<Produto[]> {
    return await this.produtoRepository.find({
      where: {
        titulo: ILike(`%${titulo.trim()}%`),
      },
      relations: {
        autores: true,
        categoria: true,
        editora: true,
      },
      order: {
        titulo: 'ASC',
      },
    });
  }

  async create(produto: Produto): Promise<Produto> {
    
    await this.validateAutores(produto.autores);
    
    await this.categoriaService.findById(produto.categoria.id);
    await this.editoraService.findById(produto.editora.id);

    return await this.produtoRepository.save(produto);
  }

  async update(produto: Produto): Promise<Produto> {
    if (!produto || !produto.id)
      throw new HttpException('Produto inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(produto.id);

    await this.validateAutores(produto.autores);

    await this.categoriaService.findById(produto.categoria.id);
    await this.editoraService.findById(produto.editora.id);

    return await this.produtoRepository.save(produto);
  }

  async delete(id: number): Promise<DeleteResult> {
    if (id <= 0)
      throw new HttpException('Id inválido!', HttpStatus.BAD_REQUEST);

    await this.findById(id);

    return await this.produtoRepository.delete(id);
  }

  private async validateAutores(autores: any[]): Promise<void> {
    if (!autores || !Array.isArray(autores)) {
      throw new HttpException(
        'Lista de autores inválida',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const autor of autores) {
      try {
        await this.autorService.findById(autor.id);
      } catch (error) {
        throw new HttpException(
          `Autor com ID ${autor.id} não encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }
}

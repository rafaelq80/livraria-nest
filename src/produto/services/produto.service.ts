import { AutorService } from './../../autor/services/autor.service';
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Produto } from "../entities/produto.entity";
import { DeleteResult, ILike, Repository } from "typeorm";

@Injectable()
export class ProdutoService{
    constructor(
        @InjectRepository(Produto)
        private produtoRepository: Repository<Produto>,
        private autorService: AutorService
    ){}

    async findAll(): Promise<Produto[]>{
        return await this.produtoRepository.find({
            relations: {
                autores: true
            }
        });

    }

    async findById(id: number): Promise<Produto> {

        let produto = await this.produtoRepository.findOne({
            where:{
                id
            },
            relations: {
                autores: true
            }
        });

        if (!produto)
            throw new HttpException('Produto não encontrado!', HttpStatus.NOT_FOUND);

        return produto;

    }

    async findByTitulo(titulo: string): Promise<Produto[]>{
        return await this.produtoRepository.find({
            where:{
                titulo: ILike(`%${titulo}%`)
            },
            relations: {
                autores: true
            }
        })

    }

    async create(produto: Produto): Promise<Produto> {
        
        if (produto.autores) {

            for (const autor of produto.autores) {
                const buscaAutor = await this.autorService.findById(autor.id);
                if (!buscaAutor) {
                    throw new HttpException('Autor não foi encontrado!', HttpStatus.NOT_FOUND);
                }
            }

        }
    
        return await this.produtoRepository.save(produto);
    }
    
    async update(produto: Produto): Promise<Produto>{
        
        let buscaProduto: Produto = await this.findById(produto.id);

        if (!buscaProduto || !produto.id)
            throw new HttpException('Produto não foi encontrado!', HttpStatus.NOT_FOUND)

        if (produto.autores) {

            for (const autor of produto.autores) {
                const buscaAutor = await this.autorService.findById(autor.id);
                if (!buscaAutor) {
                    throw new HttpException('Autor não foi encontrado!', HttpStatus.NOT_FOUND);
                }
            }
            
        }

        return await this.produtoRepository.save(produto);

    }

    async delete(id: number): Promise<DeleteResult>{
        
        let buscaProduto: Produto = await this.findById(id);
        
        if (!buscaProduto)
            throw new HttpException('Produto não foi encontrado!', HttpStatus.NOT_FOUND)

        return await this.produtoRepository.delete(id);
        
    }

}
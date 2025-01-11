import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, ILike, Repository } from "typeorm";
import { Autor } from '../entities/autor.entity';

@Injectable()
export class AutorService{
    constructor(
        @InjectRepository(Autor)
        private autorRepository: Repository<Autor>
    ){}

    async findAll(): Promise<Autor[]>{
        return await this.autorRepository.find({
            relations: {
                produtos: true
            }
        });

    }

    async findById(id: number): Promise<Autor> {

        let autor = await this.autorRepository.findOne({
            where:{
                id
            },
            relations: {
                produtos: true
            }
        });

        if (!autor)
            throw new HttpException('Autor não encontrado!', HttpStatus.NOT_FOUND);

        return autor;


    }

    async findByNome(nome: string): Promise<Autor[]>{
        return await this.autorRepository.find({
            where:{
                nome: ILike(`%${nome}%`)
            },
            relations: {
                produtos: true
            }
        })

    }

    async create(autor: Autor): Promise<Autor>{
        return await this.autorRepository.save(autor);
    }

    async update(autor: Autor): Promise<Autor>{
        
        let buscaAutor: Autor = await this.findById(autor.id);
        
        if (!buscaAutor || !autor.id)
            throw new HttpException('Autor não encontrado!', HttpStatus.NOT_FOUND)

        return await this.autorRepository.save(autor);

    }

    async delete(id: number): Promise<DeleteResult>{
        
        let buscaAutor: Autor = await this.findById(id);
        
        if (!buscaAutor)
            throw new HttpException('Autor não encontrado!', HttpStatus.NOT_FOUND)

        return await this.autorRepository.delete(id);
        
    }

}
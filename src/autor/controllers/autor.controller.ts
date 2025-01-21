import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Autor } from "../entities/autor.entity";
import { AutorService } from "../services/autor.service";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("/autores")
export class AutorController{

    constructor(private readonly autorService: AutorService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Autor[]>{
        return this.autorService.findAll();
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    findById(@Param('id', ParseIntPipe) id: number): Promise<Autor>{
        return this.autorService.findById(id);
    }

    @Get('/nome/:nome')
    @HttpCode(HttpStatus.OK)
    findByNome(@Param('nome') nome: string): Promise<Autor[]>{
        return this.autorService.findByNome(nome);
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    create(@Body() autor: Autor): Promise<Autor> {
        return this.autorService.create(autor);
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    update(@Body() autor: Autor): Promise<Autor> {
        return this.autorService.update(autor);
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseIntPipe) id: number){
        return this.autorService.delete(id);
    }
    
}
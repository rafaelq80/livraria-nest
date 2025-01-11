import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { Editora } from "../entities/editora.entity";
import { EditoraService } from "../services/editora.service";

@Controller("/editoras")
export class EditoraController{

    constructor(private readonly editoraService: EditoraService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Editora[]>{
        return this.editoraService.findAll();
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    findById(@Param('id', ParseIntPipe) id: number): Promise<Editora>{
        return this.editoraService.findById(id);
    }

    @Get('/nome/:nome')
    @HttpCode(HttpStatus.OK)
    findByNome(@Param('nome') nome: string): Promise<Editora[]>{
        return this.editoraService.findByNome(nome);
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    create(@Body() editora: Editora): Promise<Editora> {
        return this.editoraService.create(editora);
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    update(@Body() editora: Editora): Promise<Editora> {
        return this.editoraService.update(editora);
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseIntPipe) id: number){
        return this.editoraService.delete(id);
    }
    
}
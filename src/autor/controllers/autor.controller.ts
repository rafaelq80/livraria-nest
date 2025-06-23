import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Autor } from "../entities/autor.entity";
import { AutorService } from "../services/autor.service";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { AtualizarAutorDto } from "../dtos/atualizarautor.dto";
import { CriarAutorDto } from "../dtos/criarautor.dto";

@ApiTags('Autor')
@ApiBearerAuth()
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
        return this.autorService.findAllByNome(nome);
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarAutorDto })
    create(@Body() autorDto: CriarAutorDto): Promise<Autor> {
        return this.autorService.create(autorDto);
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarAutorDto })
    update(@Body() autorDto: AtualizarAutorDto): Promise<Autor> {
        return this.autorService.update(autorDto);
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseIntPipe) id: number){
        return this.autorService.delete(id);
    }
    
}
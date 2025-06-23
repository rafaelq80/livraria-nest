import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Categoria } from "../entities/categoria.entity";
import { CategoriaService } from "../services/categoria.service";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { CriarCategoriaDto } from "../dtos/criarcategoria.dto";
import { AtualizarCategoriaDto } from "../dtos/atualizarcategoria.dto";

@ApiTags('Categoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/categorias")
export class CategoriaController{

    constructor(private readonly categoriaService: CategoriaService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Categoria[]>{
        return this.categoriaService.findAll();
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    findById(@Param('id', ParseIntPipe) id: number): Promise<Categoria>{
        return this.categoriaService.findById(id);
    }

    @Get('/tipo/:tipo')
    @HttpCode(HttpStatus.OK)
    findByTipo(@Param('tipo') tipo: string): Promise<Categoria[]>{
        return this.categoriaService.findAllByTipo(tipo);
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarCategoriaDto })
    create(@Body() categoriaDto: CriarCategoriaDto): Promise<Categoria> {
        return this.categoriaService.create(categoriaDto);
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarCategoriaDto })
    update(@Body() categoriaDto: AtualizarCategoriaDto): Promise<Categoria> {
        return this.categoriaService.update(categoriaDto);
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseIntPipe) id: number){
        return this.categoriaService.delete(id);
    }
    
}
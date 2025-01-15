import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Produto } from "../entities/produto.entity";
import { ProdutoService } from "../services/produto.service";
import { JwtAuthGuard } from "../../security/guard/jwt-auth.guard";


@Controller("/produtos")
export class ProdutoController{

    constructor(private readonly produtoService: ProdutoService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Produto[]>{
        return this.produtoService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    findById(@Param('id', ParseIntPipe) id: number): Promise<Produto>{
        return this.produtoService.findById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/titulo/:titulo')
    @HttpCode(HttpStatus.OK) 
    findByTitulo(@Param('titulo') titulo: string): Promise<Produto[]>{
        return this.produtoService.findByTitulo(titulo);
    }

    @UseGuards(JwtAuthGuard)
    @Post() 
    @HttpCode(HttpStatus.CREATED)
    create(@Body() produto: Produto): Promise<Produto> {
        return this.produtoService.create(produto);
    }

    @UseGuards(JwtAuthGuard)
    @Put() 
    @HttpCode(HttpStatus.OK)
    update(@Body() produto: Produto): Promise<Produto> {
        return this.produtoService.update(produto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    delete(@Param('id', ParseIntPipe) id: number){
        return this.produtoService.delete(id);
    }
    
}
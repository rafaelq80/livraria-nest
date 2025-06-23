import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Editora } from "../entities/editora.entity";
import { EditoraService } from "../services/editora.service";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { CriarEditoraDto } from "../dtos/criareditora.dto";
import { AtualizarEditoraDto } from "../dtos/atualizareditora.dto";

@ApiTags('Editora')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
        return this.editoraService.findAllByNome(nome);
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarEditoraDto })
    create(@Body() editoraDto: CriarEditoraDto): Promise<Editora> {
        return this.editoraService.create(editoraDto);
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarEditoraDto })
    update(@Body() editoraDto: AtualizarEditoraDto): Promise<Editora> {
        return this.editoraService.update(editoraDto);
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id', ParseIntPipe) id: number){
        return this.editoraService.delete(id);
    }
    
}
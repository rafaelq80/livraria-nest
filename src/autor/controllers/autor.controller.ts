import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { AtualizarAutorDto } from "../dtos/atualizarautor.dto";
import { CriarAutorDto } from "../dtos/criarautor.dto";
import { AutorService } from "../services/autor.service";

@ApiTags('Autor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/autores")
export class AutorController{

    constructor(private readonly autorService: AutorService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Autores encontrados.',
        schema: {
            example: {
                status: 'success',
                message: 'Autores encontrados.',
                data: [
                    {
                        id: 1,
                        nome: 'João Silva',
                        nacionalidade: 'Brasileira',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findAll() {
        const autores = await this.autorService.findAll();
        return {
            status: 'success',
            message: 'Autores encontrados.',
            data: autores
        };
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Autor encontrado.',
        schema: {
            example: {
                status: 'success',
                message: 'Autor encontrado.',
                data: {
                    id: 1,
                    nome: 'João Silva',
                    nacionalidade: 'Brasileira',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const autor = await this.autorService.findById(id);
        return {
            status: 'success',
            message: 'Autor encontrado.',
            data: autor
        };
    }

    @Get('/nome/:nome')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Autores encontrados por nome.',
        schema: {
            example: {
                status: 'success',
                message: 'Autores encontrados por nome.',
                data: [
                    {
                        id: 1,
                        nome: 'João Silva',
                        nacionalidade: 'Brasileira',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findByNome(@Param('nome') nome: string) {
        const autores = await this.autorService.findAllByNome(nome);
        return {
            status: 'success',
            message: 'Autores encontrados por nome.',
            data: autores
        };
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarAutorDto })
    @ApiResponse({
        status: 201,
        description: 'Autor criado com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Autor criado com sucesso.',
                data: {
                    id: 1,
                    nome: 'João Silva',
                    nacionalidade: 'Brasileira',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async create(@Body() autorDto: CriarAutorDto) {
        const autor = await this.autorService.create(autorDto);
        return {
            status: 'success',
            message: 'Autor criado com sucesso.',
            data: autor
        };
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarAutorDto })
    @ApiResponse({
        status: 200,
        description: 'Autor atualizado com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Autor atualizado com sucesso.',
                data: {
                    id: 1,
                    nome: 'João Silva',
                    nacionalidade: 'Brasileira',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async update(@Body() autorDto: AtualizarAutorDto) {
        const autor = await this.autorService.update(autorDto);
        return {
            status: 'success',
            message: 'Autor atualizado com sucesso.',
            data: autor
        };
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.autorService.delete(id);
    }
}
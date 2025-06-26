import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { AtualizarCategoriaDto } from "../dtos/atualizarcategoria.dto";
import { CriarCategoriaDto } from "../dtos/criarcategoria.dto";
import { CategoriaService } from "../services/categoria.service";

@ApiTags('Categoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/categorias")
export class CategoriaController{

    constructor(private readonly categoriaService: CategoriaService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Categorias encontradas.',
        schema: {
            example: {
                status: 'success',
                message: 'Categorias encontradas.',
                data: [
                    {
                        id: 1,
                        tipo: 'Ficção',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findAll() {
        const categorias = await this.categoriaService.findAll();
        return {
            status: 'success',
            message: 'Categorias encontradas.',
            data: categorias
        };
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Categoria encontrada.',
        schema: {
            example: {
                status: 'success',
                message: 'Categoria encontrada.',
                data: {
                    id: 1,
                    tipo: 'Ficção',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const categoria = await this.categoriaService.findById(id);
        return {
            status: 'success',
            message: 'Categoria encontrada.',
            data: categoria
        };
    }

    @Get('/tipo/:tipo')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Categorias encontradas por tipo.',
        schema: {
            example: {
                status: 'success',
                message: 'Categorias encontradas por tipo.',
                data: [
                    {
                        id: 1,
                        tipo: 'Ficção',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findByTipo(@Param('tipo') tipo: string) {
        const categorias = await this.categoriaService.findAllByTipo(tipo);
        return {
            status: 'success',
            message: 'Categorias encontradas por tipo.',
            data: categorias
        };
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarCategoriaDto })
    @ApiResponse({
        status: 201,
        description: 'Categoria criada com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Categoria criada com sucesso.',
                data: {
                    id: 1,
                    tipo: 'Ficção',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async create(@Body() categoriaDto: CriarCategoriaDto) {
        const categoria = await this.categoriaService.create(categoriaDto);
        return {
            status: 'success',
            message: 'Categoria criada com sucesso.',
            data: categoria
        };
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarCategoriaDto })
    @ApiResponse({
        status: 200,
        description: 'Categoria atualizada com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Categoria atualizada com sucesso.',
                data: {
                    id: 1,
                    tipo: 'Ficção',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async update(@Body() categoriaDto: AtualizarCategoriaDto) {
        const categoria = await this.categoriaService.update(categoriaDto);
        return {
            status: 'success',
            message: 'Categoria atualizada com sucesso.',
            data: categoria
        };
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.categoriaService.delete(id);
    }
}
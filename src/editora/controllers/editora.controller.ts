import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { AtualizarEditoraDto } from "../dtos/atualizareditora.dto";
import { CriarEditoraDto } from "../dtos/criareditora.dto";
import { EditoraService } from "../services/editora.service";

@ApiTags('Editora')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/editoras")
export class EditoraController{

    constructor(private readonly editoraService: EditoraService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Editoras encontradas.',
        schema: {
            example: {
                status: 'success',
                message: 'Editoras encontradas.',
                data: [
                    {
                        id: 1,
                        nome: 'Editora Teste',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findAll() {
        const editoras = await this.editoraService.findAll();
        return {
            status: 'success',
            message: 'Editoras encontradas.',
            data: editoras
        };
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Editora encontrada.',
        schema: {
            example: {
                status: 'success',
                message: 'Editora encontrada.',
                data: {
                    id: 1,
                    nome: 'Editora Teste',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const editora = await this.editoraService.findById(id);
        return {
            status: 'success',
            message: 'Editora encontrada.',
            data: editora
        };
    }

    @Get('/nome/:nome')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'Editoras encontradas por nome.',
        schema: {
            example: {
                status: 'success',
                message: 'Editoras encontradas por nome.',
                data: [
                    {
                        id: 1,
                        nome: 'Editora Teste',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    })
    async findByNome(@Param('nome') nome: string) {
        const editoras = await this.editoraService.findAllByNome(nome);
        return {
            status: 'success',
            message: 'Editoras encontradas por nome.',
            data: editoras
        };
    }

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CriarEditoraDto })
    @ApiResponse({
        status: 201,
        description: 'Editora criada com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Editora criada com sucesso.',
                data: {
                    id: 1,
                    nome: 'Editora Teste',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async create(@Body() editoraDto: CriarEditoraDto) {
        const editora = await this.editoraService.create(editoraDto);
        return {
            status: 'success',
            message: 'Editora criada com sucesso.',
            data: editora
        };
    }

    @Put() 
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: AtualizarEditoraDto })
    @ApiResponse({
        status: 200,
        description: 'Editora atualizada com sucesso.',
        schema: {
            example: {
                status: 'success',
                message: 'Editora atualizada com sucesso.',
                data: {
                    id: 1,
                    nome: 'Editora Teste',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                }
            }
        }
    })
    async update(@Body() editoraDto: AtualizarEditoraDto) {
        const editora = await this.editoraService.update(editoraDto);
        return {
            status: 'success',
            message: 'Editora atualizada com sucesso.',
            data: editora
        };
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.editoraService.delete(id);
    }
}
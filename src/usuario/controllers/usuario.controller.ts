import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard";
import { Usuario } from "../entities/usuario.entity";
import { UsuarioService } from "../services/usuario.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags('Usuário')
@ApiBearerAuth()
@Controller("/usuarios")
export class UsuarioController{

    constructor(private readonly usuarioService: UsuarioService){ }

    @UseGuards(JwtAuthGuard)
    @Get('/all')
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Usuario[]>{
        return this.usuarioService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    findById(@Param('id', ParseIntPipe) id: number): Promise<Usuario>{
        return this.usuarioService.findById(id)
    }

    @Post('/cadastrar')
    @UseInterceptors(FileInterceptor('foto'))
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() usuario: Usuario,
        @UploadedFile() foto: Express.Multer.File
    ): Promise<Usuario>{
        return this.usuarioService.create(usuario, foto)
    }

    @UseGuards(JwtAuthGuard)
    @Put('/atualizar')
    @HttpCode(HttpStatus.OK)
    async update(
        @Body() usuario: Usuario
    ): Promise<Usuario>{
        return this.usuarioService.update(usuario)
    }

}
﻿import {
	Body,
	Controller,
	FileTypeValidator,
	Get,
	HttpCode,
	HttpStatus,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { Usuario } from "../entities/usuario.entity"
import { UsuarioService } from "../services/usuario.service"
import { RoleService } from "./../../role/services/role.service"

@ApiTags("Usuário")
@ApiBearerAuth()
@Controller("/usuarios")
export class UsuarioController {
	constructor(
		private readonly usuarioService: UsuarioService,
		private readonly roleService: RoleService,
	) {}

	@UseGuards(JwtAuthGuard)
	@Get("/all")
	@HttpCode(HttpStatus.OK)
	findAll(): Promise<Usuario[]> {
		return this.usuarioService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	findById(@Param("id", ParseIntPipe) id: number): Promise<Usuario> {
		return this.usuarioService.findById(id)
	}

	@Post("/cadastrar")
	@UseInterceptors(FileInterceptor("foto"))
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() usuario: Usuario,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
				],
			}),
		)
		foto: Express.Multer.File,
	): Promise<Usuario> {
		
		const usuarioRoles = await this.roleService.processarRoles(usuario)

		return await this.usuarioService.create(usuarioRoles, foto)
	}

	@UseGuards(JwtAuthGuard)
	@Put("/atualizar")
	@UseInterceptors(FileInterceptor("foto"))
	@HttpCode(HttpStatus.OK)
	async update(
		@Body() usuario: Usuario,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
				],
				fileIsRequired: false
			}),
		)
		foto?: Express.Multer.File,
	): Promise<Usuario> {
		const usuarioRoles = await this.roleService.processarRoles(usuario)

		return await this.usuarioService.update(usuarioRoles, foto)
	}
}

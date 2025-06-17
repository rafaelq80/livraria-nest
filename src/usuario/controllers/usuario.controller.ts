import {
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
import { plainToInstance } from "class-transformer"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { Usuario } from "../entities/usuario.entity"
import { UsuarioService } from "../services/usuario.service"
import { CriarUsuarioDto } from "../dtos/criarusuario.dto"
import { AtualizarUsuarioDto } from "../dtos/atualizarusuario.dto"

@ApiTags("Usuário")
@ApiBearerAuth()
@Controller("/usuarios")
export class UsuarioController {
	constructor(
		private readonly usuarioService: UsuarioService,
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
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() usuarioDto: CriarUsuarioDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
				],
				fileIsRequired: false
			}),
		)
		fotoFile?: Express.Multer.File,
	): Promise<Usuario> {
		const dto = plainToInstance(CriarUsuarioDto, usuarioDto);
		return await this.usuarioService.create(dto, fotoFile);
	}

	@UseGuards(JwtAuthGuard)
	@Put("/atualizar")
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.OK)
	async update(
		@Body() usuarioDto: AtualizarUsuarioDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
				],
				fileIsRequired: false
			}),
		)
		fotoFile?: Express.Multer.File,
	): Promise<Usuario> {
		const dto = plainToInstance(AtualizarUsuarioDto, usuarioDto);
		return await this.usuarioService.update(dto, fotoFile)
	}
}

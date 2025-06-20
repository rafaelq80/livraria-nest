import {
	Body,
	ClassSerializerInterceptor,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { AtualizarUsuarioDto } from "../dtos/atualizarusuario.dto"
import { CriarUsuarioDto } from "../dtos/criarusuario.dto"
import { UsuarioService } from "../services/usuario.service"

@ApiTags("Usuário")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller("/usuarios")
export class UsuarioController {

	constructor(
		private readonly usuarioService: UsuarioService,
	) {}

	@UseGuards(JwtAuthGuard)
	@Get("/all")
	@HttpCode(HttpStatus.OK)
	async findAll() {
		const usuarios = await this.usuarioService.findAll();
		return {
			status: 'success',
			message: 'Usuários encontrados.',
			data: usuarios
		};
	}

	@UseGuards(JwtAuthGuard)
	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	async findById(@Param("id", ParseIntPipe) id: number) {
		const usuario = await this.usuarioService.findById(id);
		return {
			status: 'success',
			message: 'Usuário encontrado.',
			data: usuario
		};
	}

	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Dados para cadastro de usuário',
		type: CriarUsuarioDto,
	})
	@ApiResponse({
		status: 201,
		description: 'Usuário criado com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Usuário criado com sucesso.',
				data: {
					id: 1,
					nome: 'João da Silva',
					usuario: 'joao@email.com',
					foto: 'https://example.com/foto.jpg',
					roles: [{ id: 1, nome: 'user', descricao: 'Usuário padrão' }],
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z'
				}
			}
		}
	})
	@Post("/cadastrar")
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() usuarioDto: CriarUsuarioDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
				],
				fileIsRequired: false
			}),
		)
		fotoFile?: Express.Multer.File,
	) {
		const usuario = await this.usuarioService.create(usuarioDto, fotoFile);
		return {
			status: 'success',
			message: 'Usuário criado com sucesso.',
			data: usuario
		};
	}

	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Dados para atualização de usuário',
		type: AtualizarUsuarioDto,
	})
	@ApiResponse({
		status: 200,
		description: 'Usuário atualizado com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Usuário atualizado com sucesso.',
				data: {
					id: 1,
					nome: 'João da Silva',
					usuario: 'joao@email.com',
					foto: 'https://example.com/foto.jpg',
					roles: [{ id: 1, nome: 'user', descricao: 'Usuário padrão' }],
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z'
				}
			}
		}
	})
	@UseGuards(JwtAuthGuard)
	@Put("/atualizar")
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.OK)
	async update(
		@Body() usuarioDto: AtualizarUsuarioDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
				],
				fileIsRequired: false
			}),
		)
		fotoFile?: Express.Multer.File,
	) {
		const usuario = await this.usuarioService.update(usuarioDto, fotoFile);
		return {
			status: 'success',
			message: 'Usuário atualizado com sucesso.',
			data: usuario
		};
	}
}

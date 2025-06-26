import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
	Put,
	UseGuards,
	UseInterceptors
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { AtualizarUsuarioDto } from "../dtos/atualizarusuario.dto"
import { CriarUsuarioDto } from "../dtos/criarusuario.dto"
import { UsuarioService } from "../services/usuario.service"
import { Public } from "../../security/decorators/public.decorator"
import { UseImageKit } from "../../imagekit/decorators/imagekit.decorator"
import { ValidatedImage } from "../../imagekit/decorators/image-validation.decorator"
import { RolesAuthGuard } from "../../security/guards/roles-auth.guard"
import { Roles } from "../../security/decorators/roles.decorator"

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
	@ApiResponse({
		status: 200,
		description: 'Usuários encontrados.',
		schema: {
			example: {
				status: 'success',
				message: 'Usuários encontrados.',
				data: [
					{
						id: 1,
						nome: 'João da Silva',
						usuario: 'joao@email.com',
						foto: 'https://example.com/foto.jpg',
						roles: [{ id: 1, nome: 'user', descricao: 'Usuário padrão' }],
						createdAt: '2024-01-01T00:00:00.000Z',
						updatedAt: '2024-01-01T00:00:00.000Z'
					}
				]
			}
		}
	})
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
	@ApiResponse({
		status: 200,
		description: 'Usuário encontrado.',
		schema: {
			example: {
				status: 'success',
				message: 'Usuário encontrado.',
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
	async findById(@Param("id", ParseIntPipe) id: number) {
		const usuario = await this.usuarioService.findById(id);
		return {
			status: 'success',
			message: 'Usuário encontrado.',
			data: usuario
		};
	}

	@Public()
	@Post("/cadastrar")
	@UseImageKit()
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() usuarioDto: CriarUsuarioDto,
		@ValidatedImage() fotoFile?: Express.Multer.File,
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
	@UseImageKit()
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.OK)
	async update(
		@Body() usuarioDto: AtualizarUsuarioDto,
		@ValidatedImage({ validateDimensions: true }) fotoFile?: Express.Multer.File,
	) {
		const usuario = await this.usuarioService.update(usuarioDto, fotoFile);
		return {
			status: 'success',
			message: 'Usuário atualizado com sucesso.',
			data: usuario
		};
	}

	@UseGuards(JwtAuthGuard, RolesAuthGuard)
	@Roles("admin") 
	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param("id", ParseIntPipe) id: number) {
		await this.usuarioService.delete(id);
	}
}

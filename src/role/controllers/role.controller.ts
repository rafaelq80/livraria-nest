import {
	Body,
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
} from "@nestjs/common"
import { Role } from "../entities/role.entity"
import { RoleService } from "../services/role.service"
import { Roles } from "../../security/decorators/roles.decorator"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { RolesAuthGuard } from "../../security/guards/roles-auth.guard"
import { ApiTags, ApiBearerAuth, ApiResponse } from "@nestjs/swagger"
import { ErrorMessages } from "../../common/constants/error-messages"

@ApiTags('Role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesAuthGuard)
@Roles("admin") 
@Controller("/roles")
export class RoleController {

	constructor(private readonly roleService: RoleService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Lista todas as roles.',
		schema: {
			example: {
				status: 'success',
				message: 'Roles encontradas com sucesso.',
				data: [
					{ id: 1, nome: 'admin', descricao: 'Administrador', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', usuarios: [] }
				]
			}
		}
	})
	@ApiResponse({
		status: 500,
		description: 'Erro interno do servidor.',
		schema: { example: { status: 'error', message: ErrorMessages.GENERAL.SERVER_ERROR, data: null } }
	})
	async findAll() {
		try {
			const data = await this.roleService.findAll()
			return { status: 'success', message: 'Roles encontradas com sucesso.', data }
		} catch {
			return { status: 'error', message: ErrorMessages.GENERAL.SERVER_ERROR, data: null }
		}
	}

	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Role encontrada.',
		schema: {
			example: {
				status: 'success',
				message: 'Role encontrada com sucesso.',
				data: { id: 1, nome: 'admin', descricao: 'Administrador', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', usuarios: [] }
			}
		}
	})
	@ApiResponse({
		status: 404,
		description: 'Role não encontrada.',
		schema: { example: { status: 'error', message: ErrorMessages.ROLE.NOT_FOUND, data: null } }
	})
	async findById(@Param("id", ParseIntPipe) id: number) {
		try {
			const data = await this.roleService.findById(id)
			return { status: 'success', message: 'Role encontrada com sucesso.', data }
		} catch (error) {
			return { status: 'error', message: error?.message ?? ErrorMessages.ROLE.NOT_FOUND, data: null }
		}
	}

	@Get("/nome/:nome")
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Roles encontradas pelo nome.',
		schema: {
			example: {
				status: 'success',
				message: 'Roles encontradas com sucesso.',
				data: [
					{ id: 1, nome: 'admin', descricao: 'Administrador', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', usuarios: [] }
				]
			}
		}
	})
	async findAllByNome(@Param("nome") nome: string) {
		try {
			const data = await this.roleService.findAllByNome(nome)
			return { status: 'success', message: 'Roles encontradas com sucesso.', data }
		} catch {
			return { status: 'error', message: ErrorMessages.GENERAL.SERVER_ERROR, data: null }
		}
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiResponse({
		status: 201,
		description: 'Role criada com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Role criada com sucesso.',
				data: { id: 2, nome: 'user', descricao: 'Usuário padrão', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', usuarios: [] }
			}
		}
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos ou role já existe.',
		schema: { example: { status: 'error', message: ErrorMessages.ROLE.ALREADY_EXISTS, data: null } }
	})
	async create(@Body() role: Role) {
		try {
			const data = await this.roleService.create(role)
			return { status: 'success', message: 'Role criada com sucesso.', data }
		} catch (error) {
			return { status: 'error', message: error?.message ?? ErrorMessages.ROLE.INVALID_DATA, data: null }
		}
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Role atualizada com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Role atualizada com sucesso.',
				data: { id: 2, nome: 'user', descricao: 'Usuário padrão', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', usuarios: [] }
			}
		}
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos ou role já existe.',
		schema: { example: { status: 'error', message: ErrorMessages.ROLE.ALREADY_EXISTS, data: null } }
	})
	async update(@Body() role: Role) {
		try {
			const data = await this.roleService.update(role)
			return { status: 'success', message: 'Role atualizada com sucesso.', data }
		} catch (error) {
			return { status: 'error', message: error?.message ?? ErrorMessages.ROLE.INVALID_DATA, data: null }
		}
	}

	@Delete("/:id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiResponse({
		status: 204,
		description: 'Role removida com sucesso.',
		schema: { example: { status: 'success', message: 'Role removida com sucesso.', data: null } }
	})
	@ApiResponse({
		status: 404,
		description: 'Role não encontrada.',
		schema: { example: { status: 'error', message: ErrorMessages.ROLE.NOT_FOUND, data: null } }
	})
	async delete(@Param("id", ParseIntPipe) id: number) {
		try {
			await this.roleService.delete(id)
			return { status: 'success', message: 'Role removida com sucesso.', data: null }
		} catch (error) {
			return { status: 'error', message: error?.message ?? ErrorMessages.ROLE.NOT_FOUND, data: null }
		}
	}
}

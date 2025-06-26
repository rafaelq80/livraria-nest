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
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Roles } from "../../security/decorators/roles.decorator"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { RolesAuthGuard } from "../../security/guards/roles-auth.guard"
import { AtualizarRoleDto } from "../dtos/atualizarrole.dto"
import { CriarRoleDto } from "../dtos/criarrole.dto"
import { RoleService } from "../services/role.service"

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
		description: 'Roles encontradas.',
		schema: {
			example: {
				status: 'success',
				message: 'Roles encontradas.',
				data: [
					{
						id: 1,
						nome: 'ROLE_USER',
						descricao: 'Usuário padrão',
						createdAt: '2024-01-01T00:00:00.000Z',
						updatedAt: '2024-01-01T00:00:00.000Z'
					}
				]
			}
		}
	})
	async findAll() {
		const roles = await this.roleService.findAll();
		return {
			status: 'success',
			message: 'Roles encontradas.',
			data: roles
		};
	}

	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Role encontrada.',
		schema: {
			example: {
				status: 'success',
				message: 'Role encontrada.',
				data: {
					id: 1,
					nome: 'ROLE_USER',
					descricao: 'Usuário padrão',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z'
				}
			}
		}
	})
	async findById(@Param("id", ParseIntPipe) id: number) {
		const role = await this.roleService.findById(id);
		return {
			status: 'success',
			message: 'Role encontrada.',
			data: role
		};
	}

	@Get("/nome/:nome")
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: 'Roles encontradas por nome.',
		schema: {
			example: {
				status: 'success',
				message: 'Roles encontradas por nome.',
				data: [
					{
						id: 1,
						nome: 'ROLE_USER',
						descricao: 'Usuário padrão',
						createdAt: '2024-01-01T00:00:00.000Z',
						updatedAt: '2024-01-01T00:00:00.000Z'
					}
				]
			}
		}
	})
	async findByNome(@Param("nome") nome: string) {
		const roles = await this.roleService.findAllByNome(nome);
		return {
			status: 'success',
			message: 'Roles encontradas por nome.',
			data: roles
		};
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiBody({ type: CriarRoleDto })
	@ApiResponse({
		status: 201,
		description: 'Role criada com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Role criada com sucesso.',
				data: {
					id: 1,
					nome: 'ROLE_USER',
					descricao: 'Usuário padrão',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z'
				}
			}
		}
	})
	async create(@Body() roleDto: CriarRoleDto) {
		const role = await this.roleService.create(roleDto);
		return {
			status: 'success',
			message: 'Role criada com sucesso.',
			data: role
		};
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiBody({ type: AtualizarRoleDto })
	@ApiResponse({
		status: 200,
		description: 'Role atualizada com sucesso.',
		schema: {
			example: {
				status: 'success',
				message: 'Role atualizada com sucesso.',
				data: {
					id: 1,
					nome: 'ROLE_USER',
					descricao: 'Usuário padrão',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z'
				}
			}
		}
	})
	async update(@Body() roleDto: AtualizarRoleDto) {
		const role = await this.roleService.update(roleDto);
		return {
			status: 'success',
			message: 'Role atualizada com sucesso.',
			data: role
		};
	}

	@Delete("/:id")
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param("id", ParseIntPipe) id: number) {
		await this.roleService.delete(id);
	}
}

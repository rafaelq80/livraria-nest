import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Role } from "../entities/role.entity"
import { Usuario } from "../../usuario/entities/usuario.entity"

// Interface simples para objetos com ID
interface HasId {
	id: number
}

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(Role)
		private roleRepository: Repository<Role>,
	) {}

	async findAll(): Promise<Role[]> {
		return this.roleRepository.find({ relations: { usuarios: true } })
	}

	async findById(id: number): Promise<Role> {
		if (id <= 0) throw new BadRequestException("Id inválido!")

		const role = await this.roleRepository.findOne({
			where: { id },
			relations: { usuarios: true },
		})

		if (!role) throw new HttpException("Role não encontrado!", HttpStatus.NOT_FOUND)

		return role
	}

	async create(role: Role): Promise<Role> {
		if (!role) throw new BadRequestException("Dados do role inválidos")
		return this.roleRepository.save(role)
	}

	async update(role: Role): Promise<Role> {
		if (!role || !role.id) throw new BadRequestException("Dados do role inválidos")
		await this.findById(role.id)
		return this.roleRepository.save(role)
	}

	async delete(id: number): Promise<void> {
		await this.findById(id)
		await this.roleRepository.delete(id)
	}

	async processarRoles(usuario: Usuario): Promise<Usuario> {
		// Se não tem roles, retorna array vazio
		if (!usuario.roles) return { ...usuario, roles: [] }

		try {
			// Verifica se a entrada é uma string e converte para objeto
			const rolesData =
				typeof usuario.roles === "string" ? JSON.parse(usuario.roles) : usuario.roles

			// Verifica se é um array
			if (!Array.isArray(rolesData)) {
				throw new BadRequestException("O campo roles deve ser um array")
			}

			// Extrai os IDs válidos e cria objetos Role
			const roleIds = this.extrairIdsValidos(rolesData)
			const roles = roleIds.map((id) => ({ id }) as Role)

			// Valida se os roles existem no banco
			await this.validateRoles(roles)

			return { ...usuario, roles }
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new BadRequestException("Formato inválido para o campo roles")
		}
	}

	async validateRoles(roles: Role[]): Promise<void> {
		if (!roles || !Array.isArray(roles)) {
			throw new BadRequestException("Lista de roles inválida")
		}

		for (const role of roles) {
			await this.findById(role.id)
		}
	}

	// Extrai ids válidos (números > 0) de diversos formatos possíveis
	private extrairIdsValidos(items: unknown[]): number[] {
		return items
			.map((item) => {
				// Se for um número, retorna ele mesmo
				if (typeof item === "number") return item

				// Se for um objeto com id, retorna o id
				if (typeof item === "object" && item && "id" in item) {
					const id = (item as HasId).id
					return typeof id === "number" ? id : null
				}

				return null
			})
			.filter((id): id is number => typeof id === "number" && id > 0)
	}
}

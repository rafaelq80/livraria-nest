import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"
import { Role } from "../entities/role.entity"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { HasId } from "../../types/hasid"

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(Role)
		private readonly roleRepository: Repository<Role>,
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

	async findManyByIds(ids: number[]): Promise<Map<number, Role>> {
		if (!ids.length) return new Map()

		const roles = await this.roleRepository.findBy({ id: In(ids) })

		if (roles.length !== ids.length) {
			const foundIds = roles.map((a) => a.id)
			const missingIds = ids.filter((id) => !foundIds.includes(id))
			throw new BadRequestException(`Roles não encontrados: ${missingIds.join(", ")}`)
		}

		return new Map(roles.map((autor) => [autor.id, autor]))
	}

	async findByNome(nome: string): Promise<Role | undefined> {
		return await this.roleRepository.findOne({
			where: { nome },
			relations: {
				usuarios: true,
			},
		})
	}

	async create(role: Role): Promise<Role> {
		if (!role) throw new BadRequestException("Dados do role inválidos")
		return this.roleRepository.save(role)
	}

	async update(role: Role): Promise<Role> {
		if (!role?.id) throw new BadRequestException("Dados do role inválidos")
		await this.findById(role.id)
		return this.roleRepository.save(role)
	}

	async delete(id: number): Promise<void> {
		await this.findById(id)
		await this.roleRepository.delete(id)
	}

	// Métodos Auxiliares

	async processarRoles(usuario: Usuario): Promise<Usuario> {
		// Caso rápido: sem roles
		if (!usuario.roles) return { ...usuario, roles: [] }

		try {
			// Normalizar entrada para garantir um array
			const rolesData = this.normalizarRolesInput(usuario.roles)

			// Se vazio após normalização, retornar array vazio
			if (!rolesData.length) return { ...usuario, roles: [] }

			// Extrair IDs válidos
			const roleIds = this.extrairIdsValidos(rolesData)

			// Caso não existam IDs válidos
			if (!roleIds.length) return { ...usuario, roles: [] }

			// Buscar todos os roles de uma vez e mapear
			const rolesMap = await this.findManyByIds(roleIds)
			const roles = roleIds.map((id) => rolesMap.get(id))

			return { ...usuario, roles }
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new BadRequestException(`Formato inválido para o campo roles: ${error.message}`)
		}
	}

	private normalizarRolesInput(roles: unknown): unknown[] {
		if (Array.isArray(roles)) return roles

		if (typeof roles === "string") {
			try {
				const parsed = JSON.parse(roles)
				return Array.isArray(parsed) ? parsed : []
			} catch {
				return []
			}
		}

		return []
	}

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

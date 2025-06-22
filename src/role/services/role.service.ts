import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository } from "typeorm"
import { Role } from "../entities/role.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class RoleService {
	private readonly logger = new Logger(RoleService.name)

	constructor(
		@InjectRepository(Role)
		private readonly roleRepository: Repository<Role>
	) {}

	async findAll(): Promise<Role[]> {
		return await this.roleRepository.find({
			relations: {
				usuarios: true
			},
			order: {
				nome: "ASC"
			}
		})
	}

	async findById(id: number): Promise<Role> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const role = await this.roleRepository.findOne({
			where: { id },
			relations: { usuarios: true }
		})

		if (!role) throw new NotFoundException(ErrorMessages.ROLE.NOT_FOUND)

		return role
	}

	async findAllByNome(nome: string): Promise<Role[]> {
		return await this.roleRepository.find({
			where: { nome: ILike(`%${nome.trim()}%`), },
			relations: {
				usuarios: true
			}
		})
	}

	async findByNome(nome: string): Promise<Role | undefined> {
		return await this.roleRepository.findOne({
			where: { nome },
			relations: { usuarios: true }
		})
	}

	async create(role: Role): Promise<Role> {
		if (!role?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.ROLE.INVALID_DATA)
		}

		const roleExistente = await this.findByNome(role.nome.trim())
		if (roleExistente) {
			throw new BadRequestException(ErrorMessages.ROLE.ALREADY_EXISTS)
		}

		const novaRole = this.roleRepository.create({
			nome: role.nome.trim()
		})

		try {
			return await this.roleRepository.save(novaRole)
		} catch (error) {
			this.logger.error('Erro ao criar role:', error)
			throw error
		}
	}

	async update(role: Role): Promise<Role> {
		if (!role?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!role?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.ROLE.INVALID_DATA)
		}

		const roleAtual = await this.findById(role.id)

		const roleExistente = await this.findByNome(role.nome.trim())
		if (roleExistente && roleExistente.id !== role.id) {
			throw new BadRequestException(ErrorMessages.ROLE.ALREADY_EXISTS)
		}

		roleAtual.nome = role.nome.trim()

		try {
			return await this.roleRepository.save(roleAtual)
		} catch (error) {
			this.logger.error('Erro ao atualizar role:', error)
			throw error
		}
	}

	async delete(id: number): Promise<void> {
		const role = await this.findById(id)
		if (role.usuarios && role.usuarios.length > 0) {
			throw new BadRequestException(ErrorMessages.ROLE.CANNOT_DELETE_WITH_USERS)
		}
		await this.roleRepository.delete(id)
	}

}

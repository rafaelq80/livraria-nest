import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository, In } from "typeorm"
import { Role } from "../entities/role.entity"
import { ErrorMessages } from "../../common/constants/error-messages"
import { CriarRoleDto } from "../dtos/criarrole.dto"
import { AtualizarRoleDto } from "../dtos/atualizarrole.dto"

@Injectable()
export class RoleService implements OnModuleInit {
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

	async findAllByIds(ids: number[]): Promise<Role[]> {
		if (!Array.isArray(ids) || ids.length === 0) return [];
		return await this.roleRepository.find({
			where: { id: In(ids) }
		});
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

	async create(roleDto: CriarRoleDto): Promise<Role> {
		if (!roleDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.ROLE.INVALID_DATA)
		}

		const roleExistente = await this.findByNome(roleDto.nome.trim())
		if (roleExistente) {
			throw new BadRequestException(ErrorMessages.ROLE.ALREADY_EXISTS)
		}

		try {
			return await this.roleRepository.save(roleDto)
		} catch (error) {
			this.logger.error('Erro ao criar role:', error)
			throw error
		}
	}

	async update(roleDto: AtualizarRoleDto): Promise<Role> {
		if (!roleDto?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!roleDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.ROLE.INVALID_DATA)
		}

		await this.findById(roleDto.id)

		const roleExistente = await this.findByNome(roleDto.nome.trim())
		if (roleExistente && roleExistente.id !== roleDto.id) {
			throw new BadRequestException(ErrorMessages.ROLE.ALREADY_EXISTS)
		}

		try {
			return await this.roleRepository.save(roleDto)
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
		
		const result = await this.roleRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.ROLE.NOT_FOUND)
		}
	}

	async onModuleInit() {
		// Roles padrão
		const defaultRoles: CriarRoleDto[] = [
			{ nome: 'admin', descricao: 'Administrador do sistema' },
			{ nome: 'user', descricao: 'Usuário padrão' },
		];
		for (const role of defaultRoles) {
			const exists = await this.findByNome(role.nome);
			if (!exists) {
				await this.create(role);
				this.logger.log(`Role padrão criada: ${role.nome}`);
			}
		}
	}
}

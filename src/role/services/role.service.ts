import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { Usuario } from "../../usuario/entities/usuario.entity";

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(Role)
		private roleRepository: Repository<Role>,
	) {}

	async findAll(): Promise<Role[]> {
		return await this.roleRepository.find({
			relations: {
				usuarios: true,
			},
		})
	}

	async findById(id: number): Promise<Role> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		const role = await this.roleRepository.findOne({
			where: {
				id,
			},
			relations: {
				usuarios: true,
			}
		})

		if (!role) throw new HttpException("Role não encontrado!", HttpStatus.NOT_FOUND)

		return role
	}	

	async create(role: Role): Promise<Role> {
		if (!role) throw new HttpException("Dados do role inválidos", HttpStatus.BAD_REQUEST)

		return await this.roleRepository.save(role)
	}

	async update(role: Role): Promise<Role> {
		if (!role || !role.id)
			throw new HttpException("Dados do role inválidos", HttpStatus.BAD_REQUEST)

		await this.findById(role.id)

		return await this.roleRepository.save(role)
	}

	async delete(id: number): Promise<void> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(id)
		await this.roleRepository.delete(id)
	}

	async processarRoles(usuario: Usuario) {
		// Se o campo roles não existir, retorna o usuário com roles como um array vazio ([]).
		if (!usuario.roles) return { ...usuario, roles: [] };
	
		try {
			// Se roles for uma string JSON, faz o parse para um array.
			const parsedRoles = typeof usuario.roles === "string" ? JSON.parse(usuario.roles) : usuario.roles;
	
			// Se roles não for um array, lança um erro informando que precisa ser um array de números.
			if (!Array.isArray(parsedRoles)) {
				throw new BadRequestException("O campo roles deve ser um array de números.");
			}
	
			// Extrai os IDs dos objetos { id: number } e filtra valores inválidos.
			const rolesArray = parsedRoles
				.map((role) => (typeof role === "object" && role.id ? role.id : role))
				.filter((id) => typeof id === "number" && id > 0);
	
			// Converte os IDs filtrados de volta para objetos Role antes da validação
			const rolesParaValidar: Role[] = rolesArray.map((id) => ({ id } as Role));
	
			// Chama a função validateRoles para verificar se os roles existem
			await this.validateRoles(rolesParaValidar);
	
			// Retorna o usuário original, mantendo os IDs das roles validadas
			return { ...usuario, roles: rolesParaValidar };
	
		} catch (error: unknown) {
			console.error(error);
			throw new BadRequestException("Formato inválido para o campo roles. Deve ser um array JSON.");
		}
	}
	

	async validateRoles(roles: Role[]): Promise<void> {
		if (!roles || !Array.isArray(roles)) {
			throw new HttpException("Lista de roles inválida", HttpStatus.BAD_REQUEST)
		}

		for (const role of roles) {
			try {
				await this.findById(role.id)
			}catch (error: unknown) {
				console.error("Erro: ", error instanceof Error ? error.message : error);
				throw new HttpException(
					`Role id ${role.id} não encontrado`,
					HttpStatus.NOT_FOUND,
				)
			}
		}
	}
	
}

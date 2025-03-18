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
		if (!usuario.roles) return { ...usuario, roles: [] };
	
		try {
			const parsedRoles = typeof usuario.roles === "string" ? JSON.parse(usuario.roles) : usuario.roles;
	
			if (!Array.isArray(parsedRoles)) {
				throw new BadRequestException("O campo roles deve ser um array de números.");
			}
	
			const rolesArray = parsedRoles
				.map((role) => (typeof role === "object" && role.id ? role.id : role))
				.filter((id) => typeof id === "number" && id > 0);
	
			//console.log("IDs das roles recebidos:", rolesArray);
			
			const roles = await Promise.all(rolesArray.map((id) => this.findById(id)));
			return { ...usuario, roles };
		} catch (error) {
			console.error(error);
			throw new BadRequestException("Formato inválido para o campo roles. Deve ser um array JSON.");
		}
	}
	
}

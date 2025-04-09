import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { RoleService } from "../../role/services/role.service"
import { Bcrypt } from "../../security/bcrypt/bcrypt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { Usuario } from "../entities/usuario.entity"
import { Role } from "../../role/entities/role.entity"

@Injectable()
export class UsuarioService {
	constructor(
		@InjectRepository(Usuario)
		private usuarioRepository: Repository<Usuario>,
		private readonly roleService: RoleService,
		private bcrypt: Bcrypt,
		private sendmailService: SendmailService,
		private imagekitService: ImageKitService,
	) {}

	async findByUsuario(usuario: string): Promise<Usuario | undefined> {
		return await this.usuarioRepository.findOne({
			where: { usuario },
			relations: {
				roles: true,
			},
		})
	}

	async findAll(): Promise<Usuario[]> {
		return await this.usuarioRepository.find({
			relations: {
				roles: true,
			},
		})
	}

	async findById(id: number): Promise<Usuario> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		const usuario = await this.usuarioRepository.findOne({
			where: {
				id,
			},
			relations: {
				roles: true,
			},
		})

		if (!usuario) throw new HttpException("Usuário não encontrado!", HttpStatus.NOT_FOUND)

		return usuario
	}

	async create(usuario: Usuario, foto: Express.Multer.File): Promise<Usuario> {
		if (await this.findByUsuario(usuario.usuario)) {
			throw new HttpException("O Usuario ja existe!", HttpStatus.BAD_REQUEST)
		}

		usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

		const fotoUrl = await this.imagekitService.handleImage({
			file: foto,
			recurso: "usuario",
			identificador: usuario.id.toString(),
		})

		if (fotoUrl) {
			usuario.foto = fotoUrl
		}

		const saveUsuario = await this.usuarioRepository.save(usuario)

		await this.sendmailService.sendmailConfirmacao(saveUsuario.nome, saveUsuario.usuario)

		return saveUsuario
	}

	async update(usuario: Usuario, foto?: Express.Multer.File): Promise<Usuario> {
		
		const usuarioDatabase = await this.findById(usuario.id)
		const buscaUsuario = await this.findByUsuario(usuario.usuario)

		if (buscaUsuario && usuarioDatabase.id.toString() !== usuario.id.toString()) {
			throw new HttpException("Usuário (e-mail) já Cadastrado!", HttpStatus.BAD_REQUEST)
		}

		if (foto) {
			const fotoUrl = await this.imagekitService.handleImage({
				file: foto,
				recurso: "usuario",
				identificador: usuario.id.toString(),
			})
			if (fotoUrl) {
				usuario.foto = fotoUrl
			}
		}

		usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

		// Remove os Roles Atuais
		await this.removerRolesUsuario(usuario.id)

		// Adiciona os novos Roles
		await this.adicionarRolesUsuario(usuario.id, usuario.roles)

		// Cria o Objeto de Atualização dos dados do Usuário
		const updateData = {
			nome: usuario.nome,
			usuario: usuario.usuario,
			senha: usuario.senha,
			foto: usuario.foto,
		}

		// Atualiza os dados do usuário
		await this.usuarioRepository.update(usuario.id, updateData)

		// Retorna os dados atualizados
		return this.findById(usuario.id)
	}

	async updateSenha(usuario: string, senha: string): Promise<Usuario> {
		const buscaUsuario = await this.findByUsuario(usuario)

		buscaUsuario.senha = await this.bcrypt.criptografarSenha(senha)

		return await this.usuarioRepository.save(buscaUsuario)
	}

	// Métodos Auxiliares

	async removerRolesUsuario(id: number): Promise<void> {
		// Localiza todos os Roles do usuário
		const existingRoles = await this.usuarioRepository
			.createQueryBuilder()
			.relation(Usuario, "roles")
			.of(id)
			.loadMany()

		// Remopve todos os Roles do Usuário
		if (existingRoles.length > 0) {
			await this.usuarioRepository
				.createQueryBuilder()
				.relation(Usuario, "roles")
				.of(id)
				.remove(existingRoles)
		}
	}

	async adicionarRolesUsuario(id: number, roles: Role[]): Promise<void> {
		
		// Valida os roles antes de adicionar
		if (roles && roles.length > 0) {
			await this.roleService.validateRoles(roles)

			// Adiciona os novos Roles
			await this.usuarioRepository
				.createQueryBuilder()
				.relation(Usuario, "roles")
				.of(id)
				.add(roles)
		}
	}
}

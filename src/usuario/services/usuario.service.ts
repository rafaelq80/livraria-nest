import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { RoleService } from "../../role/services/role.service"
import { Bcrypt } from "../../security/bcrypt/bcrypt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { Usuario } from "../entities/usuario.entity"

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
			}
		})

		if (!usuario) throw new HttpException("Usuário não encontrado!", HttpStatus.NOT_FOUND)

		return usuario
	}	
	

	async create(usuario: Usuario, foto: Express.Multer.File): Promise<Usuario> {

		if (await this.findByUsuario(usuario.usuario)) {
			throw new HttpException("O Usuario ja existe!", HttpStatus.BAD_REQUEST)
		}

		usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

		const fotoUrl = await this.imagekitService.handleImage({ file: foto, recurso: 'usuario', usuario: usuario.usuario })

		if (fotoUrl) {
			usuario.foto = fotoUrl
		}

		const saveUsuario = await this.usuarioRepository.save(usuario)

		await this.sendmailService.sendmailConfirmacao(saveUsuario.nome, saveUsuario.usuario)

		return saveUsuario
	}

	async update(usuario: Usuario): Promise<Usuario> {
		await this.findById(usuario.id)

		const buscaUsuario = await this.findByUsuario(usuario.usuario)

		if (buscaUsuario && buscaUsuario.id !== usuario.id) {
			throw new HttpException("Usuário (e-mail) já Cadastrado!", HttpStatus.BAD_REQUEST)
		}

		await this.roleService.validateRoles(usuario.roles)

		usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

		return await this.usuarioRepository.save(usuario)
	}

	async updateSenha(usuario: string, senha: string): Promise<Usuario> {
		const buscaUsuario = await this.findByUsuario(usuario)

		buscaUsuario.senha = await this.bcrypt.criptografarSenha(senha)

		return await this.usuarioRepository.save(buscaUsuario)
	}

	
}

import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, QueryRunner, Repository } from "typeorm"
import { ErrorMessages } from "../../common/constants/error-messages"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Role } from "../../role/entities/role.entity"
import { RoleService } from "../../role/services/role.service"
import { Bcrypt } from "../../security/bcrypt/bcrypt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { AtualizarUsuarioDto } from "../dtos/atualizarusuario.dto"
import { CriarUsuarioDto } from "../dtos/criarusuario.dto"
import { Usuario } from "../entities/usuario.entity"

@Injectable()
export class UsuarioService {
	private readonly logger = new Logger(UsuarioService.name)

	constructor(
		@InjectRepository(Usuario)
		private readonly usuarioRepository: Repository<Usuario>,
		@InjectRepository(Role)
		private readonly roleRepository: Repository<Role>,
		private readonly roleService: RoleService,
		private readonly bcrypt: Bcrypt,
		private readonly sendmailService: SendmailService,
		private readonly imagekitService: ImageKitService,
	) {}

	async findAll(): Promise<Usuario[]> {
		return await this.usuarioRepository.find({
			relations: {
				roles: true
			}
		})
	}

	async findById(id: number): Promise<Usuario> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const usuario = await this.usuarioRepository.findOne({
			where: { id },
			relations: {
				roles: true
			}
		})

		if (!usuario) throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)

		return usuario
	}

	async findByUsuario(usuario: string): Promise<Usuario | undefined> {
		return await this.usuarioRepository.findOne({
			where: { usuario },
			relations: {
				roles: true
			}
		})
	}

	async findByGoogleId(googleId: string): Promise<Usuario | null> {
		return this.usuarioRepository.findOne({
			where: { googleId },
			relations: ["roles"],
		})
	}

	async create(usuarioDto: CriarUsuarioDto, fotoFile: Express.Multer.File): Promise<Usuario> {
		this.logger.log('=== INICIANDO CRIAÇÃO DE USUÁRIO ===')
		this.logger.log('DTO recebido: ' + JSON.stringify(usuarioDto, null, 2))
		this.logger.log('Arquivo de foto: ' + (fotoFile ? JSON.stringify({
			fieldname: fotoFile.fieldname,
			originalname: fotoFile.originalname,
			mimetype: fotoFile.mimetype,
			size: fotoFile.size
		}, null, 2) : 'null'))

		await this.verificarUsuarioDuplicado(usuarioDto.usuario)

		const { roles, ...usuarioData } = usuarioDto

		const usuario = this.usuarioRepository.create({
			...usuarioData,
			senha: await this.bcrypt.criptografarSenha(usuarioData.senha),
			foto: fotoFile?.filename
		})

		// Validar e associar roles se fornecidos
		if (roles && roles.length > 0) {
			const rolesEncontradas = await this.roleRepository.findBy({
				id: In(roles.map(r => r.id))
			})
			if (rolesEncontradas.length !== roles.length) {
				throw new BadRequestException("Uma ou mais roles não foram encontradas")
			}
			usuario.roles = rolesEncontradas
		}

		const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner()

		try {
			await queryRunner.connect()
			await queryRunner.startTransaction()

			const saveUsuario = await queryRunner.manager.save(Usuario, usuario)

			const fotoUrl = await this.processarImagem(saveUsuario, fotoFile)
			if (fotoUrl) {
				saveUsuario.foto = fotoUrl
				await queryRunner.manager.save(Usuario, saveUsuario)
			}

			await queryRunner.commitTransaction()

			await this.sendmailService
				.sendmailConfirmacao(saveUsuario.nome, saveUsuario.usuario)
				.catch((error) => {
					this.logger.warn(`Erro ao enviar email: ${error.message}`, error.stack)
				})

			this.logger.log('=== CRIAÇÃO DE USUÁRIO CONCLUÍDA ===')
			return saveUsuario
		} catch (error) {
			await this.tratarErro(queryRunner, error)
		} finally {
			await queryRunner.release()
		}
	}

	async update(usuarioDto: AtualizarUsuarioDto, fotoFile?: Express.Multer.File): Promise<Usuario> {
		this.logger.log('=== INICIANDO ATUALIZAÇÃO DE USUÁRIO ===')
		this.logger.log('DTO recebido: ' + JSON.stringify(usuarioDto, null, 2))
		this.logger.log('Arquivo de foto: ' + (fotoFile ? JSON.stringify({
			fieldname: fotoFile.fieldname,
			originalname: fotoFile.originalname,
			mimetype: fotoFile.mimetype,
			size: fotoFile.size
		}, null, 2) : 'null'))

		if (!usuarioDto?.id) {
			throw new BadRequestException("Usuário inválido!")
		}

		const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner()

		try {
			const usuarioAtual = await this.findById(usuarioDto.id)
			const { roles, ...usuarioData } = usuarioDto

			// Atualiza os dados do usuário
			Object.assign(usuarioAtual, usuarioData)

			// Atualiza senha se fornecida
			if (usuarioData.senha) {
				usuarioAtual.senha = await this.bcrypt.criptografarSenha(usuarioData.senha)
			}

			// Atualiza foto se fornecida
			if (fotoFile) {
				const fotoUrl = await this.processarImagem(usuarioAtual, fotoFile)
				if (fotoUrl) {
					usuarioAtual.foto = fotoUrl
				}
			}

			// Validar e atualizar roles se fornecidos
			if (roles && roles.length > 0) {
				const rolesEncontradas = await this.roleRepository.findBy({
					id: In(roles.map(r => r.id))
				})
				if (rolesEncontradas.length !== roles.length) {
					throw new BadRequestException("Uma ou mais roles não foram encontradas")
				}
				usuarioAtual.roles = rolesEncontradas
			}

			await queryRunner.connect()
			await queryRunner.startTransaction()

			const updateData = this.prepararDadosAtualizacao(usuarioAtual)
			await queryRunner.manager.update(Usuario, usuarioAtual.id, updateData)

			if (roles) {
				await queryRunner.manager
					.createQueryBuilder()
					.relation(Usuario, "roles")
					.of(usuarioAtual)
					.addAndRemove(roles, [])
			}

			await queryRunner.commitTransaction()

			this.logger.log('=== ATUALIZAÇÃO DE USUÁRIO CONCLUÍDA ===')
			return this.findById(usuarioAtual.id)
		} catch (error) {
			await this.tratarErro(queryRunner, error)
		} finally {
			await queryRunner.release()
		}
	}

	async updateSenha(usuario: string, senha: string): Promise<Usuario> {
		const buscaUsuario = await this.findByUsuario(usuario)

		buscaUsuario.senha = await this.bcrypt.criptografarSenha(senha)

		return await this.usuarioRepository.save(buscaUsuario)
	}

	async delete(id: number): Promise<void> {
		const result = await this.usuarioRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)
		}
	}

	// Métodos Auxiliares

	private async verificarUsuarioDuplicado(usuario: string): Promise<void> {
		const existeUsuario = await this.findByUsuario(usuario)
		if (existeUsuario) {
			throw new BadRequestException(ErrorMessages.USER.ALREADY_EXISTS)
		}
	}

	private async validarUsuarioExistente(usuario: Usuario, usuarioAtual: Usuario): Promise<void> {
		const buscaUsuario = await this.findByUsuario(usuario.usuario)
		if (buscaUsuario && buscaUsuario.id !== usuarioAtual.id) {
			throw new BadRequestException(ErrorMessages.USER.ALREADY_EXISTS)
		}
	}

	private async atualizarSenhaSeNecessario(
		usuario: Usuario,
		usuarioAtual: Usuario,
	): Promise<string> {
		if (
			usuario.senha &&
			!(await this.bcrypt.compararSenhas(usuario.senha, usuarioAtual.senha))
		) {
			return this.bcrypt.criptografarSenha(usuario.senha)
		}
		return usuarioAtual.senha
	}

	private async atualizarFotoSeNecessario(
		usuario: Usuario,
		fotoFile: Express.Multer.File | undefined,
		usuarioAtual: Usuario,
	): Promise<string | undefined> {
		const fotoUrl = await this.processarImagem(usuario, fotoFile)
		if (fotoUrl) return fotoUrl
		return usuario.foto ?? usuarioAtual.foto
	}

	private prepararDadosAtualizacao(usuario: Usuario): Partial<Usuario> {
		const updateData: Partial<Usuario> = {}
		if (usuario.nome !== undefined) updateData.nome = usuario.nome
		if (usuario.usuario !== undefined) updateData.usuario = usuario.usuario
		if (usuario.senha !== undefined) updateData.senha = usuario.senha
		if (usuario.foto !== undefined) updateData.foto = usuario.foto
		return updateData
	}

	private async atualizarRolesSeNecessario(
		queryRunner: QueryRunner,
		usuario: Usuario,
	): Promise<void> {
		if (usuario.roles) {
			await queryRunner.manager
				.createQueryBuilder()
				.relation(Usuario, "roles")
				.of(usuario)
				.addAndRemove(usuario.roles, [])
		}
	}

	private async tratarErro(queryRunner: QueryRunner, error: unknown): Promise<void> {
		await queryRunner.rollbackTransaction()
		this.logger.error("Erro na operação:", error)
		throw error
	}

	private async processarImagem(
		usuario: Usuario,
		foto: Express.Multer.File,
	): Promise<string | null> {
		if (!foto) return null

		try {
			return await this.imagekitService.handleImage({
				file: foto,
				recurso: "usuario",
				identificador: usuario.id.toString(),
				oldImageUrl: usuario.foto
			})
		} catch (error) {
			this.logger.error("Erro ao processar imagem:", error)
			return null
		}
	}
}

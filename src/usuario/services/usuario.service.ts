import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { QueryRunner, Repository } from "typeorm"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { RoleService } from "../../role/services/role.service"
import { Bcrypt } from "../../security/bcrypt/bcrypt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { Usuario } from "../entities/usuario.entity"

@Injectable()
export class UsuarioService {
	private readonly logger = new Logger(UsuarioService.name)

	constructor(
		@InjectRepository(Usuario)
		private readonly usuarioRepository: Repository<Usuario>,
		private readonly roleService: RoleService,
		private readonly bcrypt: Bcrypt,
		private readonly sendmailService: SendmailService,
		private readonly imagekitService: ImageKitService,
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

	async create(usuario: Usuario, fotoFile: Express.Multer.File): Promise<Usuario> {
    await this.verificarUsuarioDuplicado(usuario.usuario)

    usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

     // Buscar roles usando findManyByIds
    if (usuario.roles && usuario.roles.length > 0) {
        const roleIds = usuario.roles.map(r => r.id)
        const rolesMap = await this.roleService.findManyByIds(roleIds)
        usuario.roles = roleIds.map(id => rolesMap.get(id))
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

        return saveUsuario
    } catch (error) {
        await this.tratarErro(queryRunner, error)
    } finally {
        await queryRunner.release()
    }
}

	async update(usuario: Usuario, fotoFile?: Express.Multer.File): Promise<Usuario> {
		if (!usuario?.id) {
			throw new HttpException("Usuário inválido!", HttpStatus.BAD_REQUEST)
		}

		const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner()

		try {
			const usuarioAtual = await this.findById(usuario.id)

			await this.validarUsuarioExistente(usuario, usuarioAtual)
			usuario.senha = await this.atualizarSenhaSeNecessario(usuario, usuarioAtual)
			usuario.foto = await this.atualizarFotoSeNecessario(usuario, fotoFile, usuarioAtual)

			await queryRunner.connect()
			await queryRunner.startTransaction()

			const updateData = this.prepararDadosAtualizacao(usuario)
			await queryRunner.manager.update(Usuario, usuario.id, updateData)

			await this.atualizarRolesSeNecessario(queryRunner, usuario)

			await queryRunner.commitTransaction()

			return this.findById(usuario.id)
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

	// Métodos Auxiliares

	private async verificarUsuarioDuplicado(usuario: string): Promise<void> {
		const existeUsuario = await this.findByUsuario(usuario)
		if (existeUsuario) {
			throw new HttpException("O Usuário já existe!", HttpStatus.BAD_REQUEST)
		}
	}

	private async validarUsuarioExistente(usuario: Usuario, usuarioAtual: Usuario): Promise<void> {
		const buscaUsuario = await this.findByUsuario(usuario.usuario)
		if (buscaUsuario && buscaUsuario.id !== usuarioAtual.id) {
			throw new HttpException("Usuário (e-mail) já Cadastrado!", HttpStatus.BAD_REQUEST)
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
		if (usuario.roles !== undefined) {
			const usuarioEntity = await queryRunner.manager.findOne(Usuario, {
				where: { id: usuario.id },
				relations: { roles: true },
			})
			if (usuarioEntity) {
				usuarioEntity.roles = usuario.roles || []
				await queryRunner.manager.save(Usuario, usuarioEntity)
			}
		}
	}

	private async tratarErro(queryRunner: QueryRunner, error: unknown): Promise<void> {
		if (queryRunner.isTransactionActive) {
			await queryRunner.rollbackTransaction()
		}

		this.logger.error(
			`Erro ao atualizar usuario: ${(error as Error).message}`,
			(error as Error).stack,
		)
		throw new HttpException(
			`Erro ao atualizar usuario: ${(error as Error).message}`,
			error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
		)
	}

	private async processarImagem(
		usuario: Usuario,
		foto: Express.Multer.File,
	): Promise<string | null> {
		if (!foto) return null

		try {
			return await this.imagekitService.handleImage({
				file: foto,
				recurso: "produto",
				identificador: usuario.id.toString(),
			})
		} catch (error) {
			this.logger.error(`Erro ao processar imagem: ${error.message}`, error.stack)
			return null
		}
	}
}

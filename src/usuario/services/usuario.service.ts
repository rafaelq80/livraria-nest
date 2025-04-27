import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
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
		// Verificar existência do usuário fora da transação
		if (await this.findByUsuario(usuario.usuario)) {
			throw new HttpException("O Usuario ja existe!", HttpStatus.BAD_REQUEST)
		}

		// Criptografar senha
		usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)

		// Processar imagem
		const fotoUrl = await this.processarImagem(usuario, foto)
		if (fotoUrl) {
			usuario.foto = fotoUrl
		}

		// Usar QueryRunner para transação
		const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner()

		try {
			await queryRunner.connect()
			await queryRunner.startTransaction()

			// Salvar usuário com seus roles
			const saveUsuario = await queryRunner.manager.save(Usuario, usuario)

			await queryRunner.commitTransaction()

			// Enviar email após a transação bem-sucedida
			await this.sendmailService
				.sendmailConfirmacao(saveUsuario.nome, saveUsuario.usuario)
				.catch((error) => {
					this.logger.warn(`Erro ao enviar email: ${error.message}`, error.stack)
					// Não falha a operação se o email falhar
				})

			return saveUsuario
		} catch (error) {
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction()
			}

			this.logger.error(`Erro ao criar usuario: ${error.message}`, error.stack)
			throw new HttpException(
				`Erro ao criar usuario: ${error.message}`,
				error instanceof HttpException
					? error.getStatus()
					: HttpStatus.INTERNAL_SERVER_ERROR,
			)
		} finally {
			await queryRunner.release()
		}
	}

	async update(usuario: Usuario, foto?: Express.Multer.File): Promise<Usuario> {
		if (!usuario?.id) {
			throw new HttpException("Usuário inválido!", HttpStatus.BAD_REQUEST)
		}
	
		const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner()
	
		try {
			// Buscar dados atuais do usuário
			const usuarioAtual = await this.findById(usuario.id)
			
			// Verificar se o novo email já existe e pertence a outro usuário
			const buscaUsuario = await this.findByUsuario(usuario.usuario)
			if (buscaUsuario && buscaUsuario.id !== usuarioAtual.id) {
				throw new HttpException("Usuário (e-mail) já Cadastrado!", HttpStatus.BAD_REQUEST)
			}
	
			// Só criptografar senha se for diferente da armazenada
			if (
				usuario.senha &&
				!(await this.bcrypt.compararSenhas(usuario.senha, usuarioAtual.senha))
			) {
				usuario.senha = await this.bcrypt.criptografarSenha(usuario.senha)
			} else {
				usuario.senha = usuarioAtual.senha // Manter senha atual
			}
	
			// Processar imagem se fornecida
			const fotoUrl = await this.processarImagem(usuario, foto)
			if (fotoUrl) {
				usuario.foto = fotoUrl
			} else if (!usuario.foto) {
				usuario.foto = usuarioAtual.foto // Manter foto atual se não fornecida
			}
	
			// Iniciar transação
			await queryRunner.connect()
			await queryRunner.startTransaction()
	
			// Preparar objeto de atualização apenas com campos fornecidos
			const updateData: Partial<Usuario> = {}
			if (usuario.nome !== undefined) updateData.nome = usuario.nome
			if (usuario.usuario !== undefined) updateData.usuario = usuario.usuario
			if (usuario.senha !== undefined) updateData.senha = usuario.senha
			if (usuario.foto !== undefined) updateData.foto = usuario.foto
	
			// Executar atualização
			await queryRunner.manager.update(Usuario, usuario.id, updateData)
	
			// Atualizar relações apenas se roles foram fornecidos
			if (usuario.roles !== undefined) {
				const usuarioEntity = await queryRunner.manager.findOne(Usuario, {
					where: { id: usuario.id },
					relations: { roles: true },
				})
	
				usuarioEntity.roles = usuario.roles || []
				await queryRunner.manager.save(Usuario, usuarioEntity)
			}
	
			await queryRunner.commitTransaction()
	
			// Retornar usuario atualizado
			return this.findById(usuario.id)
		} catch (error) {
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction()
			}
	
			this.logger.error(`Erro ao atualizar usuario: ${error.message}`, error.stack)
			throw new HttpException(
				`Erro ao atualizar usuario: ${error.message}`,
				error instanceof HttpException
					? error.getStatus()
					: HttpStatus.INTERNAL_SERVER_ERROR,
			)
		} finally {
			// Release de recursos independente do resultado
			await queryRunner.release()
		}
	}

	async updateSenha(usuario: string, senha: string): Promise<Usuario> {
		const buscaUsuario = await this.findByUsuario(usuario)

		buscaUsuario.senha = await this.bcrypt.criptografarSenha(senha)

		return await this.usuarioRepository.save(buscaUsuario)
	}

	// Métodos Auxiliares

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

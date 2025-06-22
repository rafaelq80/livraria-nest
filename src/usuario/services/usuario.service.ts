import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"
import { ErrorMessages } from "../../common/constants/error-messages"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Role } from "../../role/entities/role.entity"
import { RoleService } from "../../role/services/role.service"
import { Bcrypt } from "../../security/bcrypt/bcrypt"
import { SendmailService } from "../../sendmail/services/sendmail.service"
import { AtualizarUsuarioDto } from "../dtos/atualizarusuario.dto"
import { CriarUsuarioDto } from "../dtos/criarusuario.dto"
import { Usuario } from "../entities/usuario.entity"
import { isEmail } from "class-validator"

@Injectable()
export class UsuarioService {
	private readonly logger = new Logger(UsuarioService.name)
	private static readonly SENHA_FORTE_REGEX =
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

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
		return this.usuarioRepository.find({
			relations: {
				roles: true,
			},
		})
	}

	async findById(id: number): Promise<Usuario> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const usuario = await this.usuarioRepository.findOne({
			where: { id },
			relations: {
				roles: true,
			},
		})

		if (!usuario) throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)

		return usuario
	}

	async findByUsuario(usuario: string): Promise<Usuario | undefined> {
		return await this.usuarioRepository.findOne({
			where: { usuario },
			relations: {
				roles: true,
			},
		})
	}

	async findByGoogleId(googleId: string): Promise<Usuario | null> {
		return this.usuarioRepository.findOne({
			where: { googleId },
			relations: ["roles"],
		})
	}

	async create(usuarioDto: CriarUsuarioDto, fotoFile?: Express.Multer.File): Promise<Usuario> {
		this.logger.log("=== INICIANDO CRIAÇÃO DE USUÁRIO ===")
		this.logger.log("DTO recebido: " + JSON.stringify(usuarioDto, null, 2))
		this.logger.log(
			"Arquivo de foto: " +
				(fotoFile
					? JSON.stringify(
							{
								fieldname: fotoFile.fieldname,
								originalname: fotoFile.originalname,
								mimetype: fotoFile.mimetype,
								size: fotoFile.size,
							},
							null,
							2,
						)
					: "null"),
		)

		usuarioDto.usuario = this.normalizarEmail(usuarioDto.usuario)
		this.validarEmail(usuarioDto.usuario)
		this.validarSenha(usuarioDto.senha)
		await this.verificarUsuarioDuplicado(usuarioDto.usuario)

		const { roles, ...usuarioData } = usuarioDto
		const rolesParaAssociar = await this.obterRolesOuPadrao(roles)
		const usuario = this.usuarioRepository.create({
			...usuarioData,
			senha: await this.bcrypt.criptografarSenha(usuarioDto.senha),
			roles: rolesParaAssociar,
		})

		let usuarioPersistido = await this.usuarioRepository.save(usuario)
		if (fotoFile) {
			const fotoUrl = await this.imagekitService.processarUsuarioImage(
				usuarioPersistido.id,
				fotoFile
			)
			if (fotoUrl) {
				usuarioPersistido.foto = fotoUrl
				usuarioPersistido = await this.usuarioRepository.save(usuarioPersistido)
			}
		}

		await this.sendmailService
			.sendmailConfirmacaoLegacy(usuarioPersistido.nome, usuarioPersistido.usuario)
			.catch((error) => {
				this.logger.warn(`Erro ao enviar email: ${error.message}`, error.stack)
			})

		this.logger.log("=== CRIAÇÃO DE USUÁRIO CONCLUÍDA ===")
		return usuarioPersistido
	}

	async update(
		usuarioDto: AtualizarUsuarioDto,
		fotoFile?: Express.Multer.File,
	): Promise<Usuario> {
		this.logger.log("=== INICIANDO ATUALIZAÇÃO DE USUÁRIO ===")
		this.logger.log("DTO recebido: " + JSON.stringify(usuarioDto, null, 2))
		this.logger.log(
			"Arquivo de foto: " +
				(fotoFile
					? JSON.stringify(
							{
								fieldname: fotoFile.fieldname,
								originalname: fotoFile.originalname,
								mimetype: fotoFile.mimetype,
								size: fotoFile.size,
							},
							null,
							2,
						)
					: "null"),
		)

		if (!usuarioDto?.id) {
			throw new BadRequestException(ErrorMessages.USER.INVALID_ID)
		}

		const usuarioAtual = await this.findById(usuarioDto.id)
		const { roles, ...usuarioData } = usuarioDto

		if (usuarioDto.usuario) {
			usuarioData.usuario = this.normalizarEmail(usuarioDto.usuario)
			this.validarEmail(usuarioData.usuario)
		}
		if (usuarioDto.senha) {
			this.validarSenha(usuarioDto.senha)
			usuarioData.senha = await this.bcrypt.criptografarSenha(usuarioDto.senha)
		}

		if (fotoFile) {
			const fotoUrl = await this.imagekitService.processarUsuarioImage(
				usuarioAtual.id,
				fotoFile,
				usuarioAtual.foto
			)
			if (fotoUrl) {
				(usuarioData as Partial<Usuario>).foto = fotoUrl
			}
		}

		// Atualizar dados básicos
		if (Object.keys(usuarioData).length > 0) {
			await this.usuarioRepository.update(usuarioDto.id, usuarioData)
		}

		// Atualizar roles se fornecidas
		if (roles !== undefined) {
			const rolesParaAssociar = await this.obterRolesOuPadrao(roles)
			usuarioAtual.roles = rolesParaAssociar
			await this.usuarioRepository.save(usuarioAtual)
		}

		const usuarioPersistido = await this.findById(usuarioDto.id)
		this.logger.log("Usuario atualizado: " + JSON.stringify(usuarioPersistido, null, 2))

		this.logger.log("=== ATUALIZAÇÃO DE USUÁRIO CONCLUÍDA ===")
		return usuarioPersistido
	}

	async updateSenha(usuario: string, senha: string): Promise<Usuario> {
		const buscaUsuario = await this.findByUsuario(usuario)

		buscaUsuario.senha = await this.bcrypt.criptografarSenha(senha)

		return this.usuarioRepository.save(buscaUsuario)
	}

	async delete(id: number): Promise<void> {
		const result = await this.usuarioRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)
		}
	}

	// Métodos Auxiliares

	private normalizarEmail(email: string): string {
		return email.trim().toLowerCase()
	}

	private validarEmail(email: string): void {
		if (!email) throw new BadRequestException(ErrorMessages.USER.EMAIL_REQUIRED)
		if (!isEmail(email)) throw new BadRequestException(ErrorMessages.USER.EMAIL_INVALID)
	}

	private validarSenha(senha: string): void {
		if (!senha) throw new BadRequestException(ErrorMessages.USER.PASSWORD_REQUIRED)
		if (!UsuarioService.SENHA_FORTE_REGEX.test(senha))
			throw new BadRequestException(ErrorMessages.USER.PASSWORD_WEAK)
	}

	private async verificarUsuarioDuplicado(usuario: string): Promise<void> {
		const existeUsuario = await this.findByUsuario(usuario)
		if (existeUsuario) throw new BadRequestException(ErrorMessages.USER.ALREADY_EXISTS)
	}

	private async obterRolesOuPadrao(
		roles: { id: number }[] | Role[] | string[] | string | undefined,
	): Promise<Role[]> {
		// Se for string escapada, faz o parse
		if (typeof roles === 'string') {
			try {
				roles = JSON.parse(roles);
			} catch {
				throw new BadRequestException(ErrorMessages.USER.ROLES_INVALID);
			}
		}
		// Se for array, mas os itens são strings JSON, faz o parse de cada um
		if (Array.isArray(roles)) {
			roles = roles.map((r) => {
				if (typeof r === 'string') {
					try {
						return JSON.parse(r);
					} catch {
						throw new BadRequestException(ErrorMessages.USER.ROLES_INVALID);
					}
				}
				return r;
			});
		} else {
			roles = [];
		}

		if (roles.length > 0) {
			const ids = roles
				.map((r) => Number((r as { id: number }).id))
				.filter((id) => !isNaN(id) && id > 0);
			if (ids.length !== roles.length)
				throw new BadRequestException(ErrorMessages.USER.ROLES_INVALID);
			const rolesEncontradas = await this.roleRepository.findBy({ id: In(ids) });
			if (rolesEncontradas.length !== roles.length)
				throw new BadRequestException(ErrorMessages.USER.ROLES_NOT_FOUND);
			return rolesEncontradas;
		}
		const defaultRole = await this.roleService.findByNome("user");
		if (!defaultRole) throw new BadRequestException(ErrorMessages.ROLE.NOT_FOUND);
		return [defaultRole];
	}
}


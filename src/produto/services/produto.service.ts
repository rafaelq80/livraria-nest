import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, QueryFailedError, Repository } from "typeorm"
import { AutorService } from "../../autor/services/autor.service"
import { CategoriaService } from "../../categoria/services/categoria.service"
import { ErrorMessages } from "../../common/constants/error-messages"
import { EditoraService } from "../../editora/services/editora.service"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { AtualizarProdutoDto } from "../dtos/atualizarproduto.dto"
import { AutorIdDto, CategoriaIdDto, CriarProdutoDto, EditoraIdDto } from "../dtos/criarproduto.dto"
import { Produto } from "../entities/produto.entity"

@Injectable()
export class ProdutoService {
	private readonly logger = new Logger(ProdutoService.name)

	constructor(
		@InjectRepository(Produto)
		private readonly produtoRepository: Repository<Produto>,
		private readonly imageKitService: ImageKitService,
		private readonly categoriaService: CategoriaService,
		private readonly editoraService: EditoraService,
		private readonly autorService: AutorService,
	) {}

	async findAll(): Promise<Produto[]> {
		return await this.produtoRepository.find({
			relations: {
				categoria: true,
				editora: true,
				autores: true,
			},
		})
	}

	async findById(id: number): Promise<Produto> {
		if (id <= 0) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		const produto = await this.produtoRepository.findOne({
			where: { id },
			relations: {
				categoria: true,
				editora: true,
				autores: true,
			},
		})

		if (!produto) {
			throw new NotFoundException(ErrorMessages.PRODUTO.NOT_FOUND)
		}

		return produto
	}

	async findAllByTitulo(titulo: string): Promise<Produto[]> {
		return await this.produtoRepository.find({
			where: {
				titulo: ILike(`%${titulo.trim()}%`),
			},
			relations: {
				categoria: true,
				editora: true,
				autores: true,
			},
			order: {
				titulo: "ASC",
			},
		})
	}

	async create(produtoDto: CriarProdutoDto, fotoFile?: Express.Multer.File): Promise<Produto> {
		// Validações
		await this.validateCategoria(produtoDto.categoria)
		await this.validateEditora(produtoDto.editora)
		await this.validateAutores(produtoDto.autores)

		let fotoUrl: string | undefined

		// Upload da imagem ANTES de salvar no banco
		if (fotoFile) {
			const tempId = Date.now()

			try {
				fotoUrl = await this.imageKitService.handleImage({
					file: fotoFile,
					recurso: "produto",
					identificador: tempId.toString(),
				})

				if (!fotoUrl) {
					throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
				}
			} catch (error) {
				this.logger.error(
					`Falha no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				)
				throw new BadRequestException(
					`${ErrorMessages.IMAGE.UPLOAD_FAILED}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				)
			}
		}

		// Cria produto com URL da foto
		const produto = this.produtoRepository.create({
			...produtoDto,
			foto: fotoUrl,
		})

		try {
			const savedProduto = await this.produtoRepository.save(produto)
			this.logger.log(`Produto criado: ID ${savedProduto.id}`)
			return savedProduto
		} catch (error) {
			// Rollback: deleta imagem se falhou ao salvar
			if (fotoUrl) {
				this.logger.warn(`Deletando imagem órfã: ${fotoUrl}`)
				try {
					await this.imageKitService.deleteImageByUrl(fotoUrl)
				} catch (deleteError) {
					this.logger.error(
						`Erro ao deletar imagem órfã: ${deleteError instanceof Error ? deleteError.message : "Erro desconhecido"}`,
					)
				}
			}

			this.handleSaveError(error)
		}
	}

	async update(
		produtoDto: AtualizarProdutoDto,
		fotoFile?: Express.Multer.File,
	): Promise<Produto> {
		const produto = await this.findById(produtoDto.id)
		const oldFotoUrl = produto.foto

		// Validações
		await this.validateCategoria(produtoDto.categoria)
		await this.validateEditora(produtoDto.editora)
		await this.validateAutores(produtoDto.autores)

		let novaFotoUrl: string | undefined

		// Upload de nova imagem ANTES de atualizar no banco
		if (fotoFile) {
			try {
				novaFotoUrl = await this.imageKitService.processarProdutoImage(
					produto.id,
					fotoFile,
					oldFotoUrl,
				)

				if (!novaFotoUrl) {
					throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
				}
			} catch (error) {
				this.logger.error(
					`Falha no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				)
				throw new BadRequestException(
					`${ErrorMessages.IMAGE.UPLOAD_FAILED}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				)
			}
		}

		// Atualiza produto (remove 'foto' do DTO para não sobrescrever com undefined)
		const dadosParaAtualizar = { ...produtoDto }
		delete dadosParaAtualizar.foto

		Object.assign(produto, {
			...dadosParaAtualizar,
			...(novaFotoUrl && { foto: novaFotoUrl }),
		})

		try {
			const updatedProduto = await this.produtoRepository.save(produto)
			this.logger.log(`Produto atualizado: ID ${updatedProduto.id}`)
			return updatedProduto
		} catch (error) {
			// Rollback: deleta nova imagem se falhou ao atualizar
			if (novaFotoUrl && novaFotoUrl !== oldFotoUrl) {
				this.logger.warn(`Deletando nova imagem órfã: ${novaFotoUrl}`)
				try {
					await this.imageKitService.deleteImageByUrl(novaFotoUrl)
				} catch (deleteError) {
					this.logger.error(
						`Erro ao deletar imagem órfã: ${deleteError instanceof Error ? deleteError.message : "Erro desconhecido"}`,
					)
				}
			}

			this.handleSaveError(error)
		}
	}

	async delete(id: number): Promise<void> {
		const produto = await this.findById(id)

		// Deleta imagem antes de deletar produto
		if (produto.foto) {
			try {
				await this.imageKitService.deleteImageByUrl(produto.foto)
			} catch (error) {
				this.logger.warn(
					`Erro ao deletar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				)
				// Continua mesmo se falhar
			}
		}

		const resultado = await this.produtoRepository.delete(id)

		if (resultado.affected === 0) {
			throw new NotFoundException(ErrorMessages.PRODUTO.NOT_FOUND)
		}

		this.logger.log(`Produto deletado: ID ${id}`)
	}

	// Métodos de validação

	private async validateCategoria(categoria: CategoriaIdDto): Promise<void> {
		if (!categoria?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		const buscaCategoria = await this.categoriaService.findById(categoria.id)
		if (!buscaCategoria) {
			throw new BadRequestException(
				`${ErrorMessages.CATEGORIA.NOT_FOUND} (ID ${categoria.id})`,
			)
		}
	}

	private async validateEditora(editora: EditoraIdDto): Promise<void> {
		if (!editora?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		const buscaEditora = await this.editoraService.findById(editora.id)
		if (!buscaEditora) {
			throw new BadRequestException(`${ErrorMessages.EDITORA.NOT_FOUND} (ID ${editora.id})`)
		}
	}

	private async validateAutores(autores: AutorIdDto[]): Promise<void> {
		if (!autores || !Array.isArray(autores) || autores.length === 0) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_DATA)
		}

		const ids = autores.map((a) => a.id)
		if (ids.some((id) => !id)) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		const encontrados = await this.autorService.findAllByIds(ids)
		if (encontrados.length !== ids.length) {
			const encontradosIds = new Set(encontrados.map((a) => a.id))
			const naoEncontrados = ids.filter((id) => !encontradosIds.has(id))
			throw new BadRequestException(
				`${ErrorMessages.AUTHOR.NOT_FOUND} (ID(s) ${naoEncontrados.join(", ")})`,
			)
		}
	}

	private handleSaveError(error: unknown): never {
		if (error instanceof QueryFailedError && typeof error.message === "string") {
			const msg = error.message.toLowerCase()

			if (msg.includes("unique") || msg.includes("constraint")) {
				if (msg.includes("isbn13")) {
					throw new BadRequestException(
						`${ErrorMessages.PRODUTO.ALREADY_EXISTS} (ISBN13)`,
					)
				}
				if (msg.includes("isbn10")) {
					throw new BadRequestException(
						`${ErrorMessages.PRODUTO.ALREADY_EXISTS} (ISBN10)`,
					)
				}
			}
		}

		throw error
	}
}

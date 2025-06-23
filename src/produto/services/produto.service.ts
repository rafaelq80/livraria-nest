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
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const produto = await this.produtoRepository.findOne({
			where: { id },
			relations: {
				categoria: true,
				editora: true,
				autores: true,
			},
		})

		if (!produto) throw new NotFoundException(ErrorMessages.PRODUTO.NOT_FOUND)

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
		
		await this.validateCategoria(produtoDto.categoria)
		await this.validateEditora(produtoDto.editora)
		await this.validateAutores(produtoDto.autores)

		const produto = this.produtoRepository.create(produtoDto)

		let savedProduto: Produto
		try {
			savedProduto = await this.produtoRepository.save(produto)
		} catch (error) {
			this.logger.error(`[ProdutoService][create] ${ErrorMessages.PRODUTO.CREATE_FAILED} Dados: ${JSON.stringify(produtoDto)}. Erro: ${error instanceof Error ? error.message : error}`)
			this.handleSaveError(error)
		}

		if (fotoFile) {
			await this.processFotoFile(savedProduto, fotoFile)
		}

		return savedProduto
	}

	async update(
		produtoDto: AtualizarProdutoDto,
		fotoFile?: Express.Multer.File,
	): Promise<Produto> {
		
		const produto = await this.findById(produtoDto.id)

		await this.validateCategoria(produtoDto.categoria)
		await this.validateEditora(produtoDto.editora)
		await this.validateAutores(produtoDto.autores)

		if (fotoFile) {
			await this.processFotoFile(produto, fotoFile)
			produtoDto.foto = produto.foto
		}

		Object.assign(produto, produtoDto)

		let updatedProduto: Produto
		try {
			updatedProduto = await this.produtoRepository.save(produto)
		} catch (error) {
			this.logger.error(`[ProdutoService][update] ${ErrorMessages.PRODUTO.UPDATE_FAILED} ID ${produtoDto.id}. Dados: ${JSON.stringify(produtoDto)}. Erro: ${error instanceof Error ? error.message : error}`)
			this.handleSaveError(error)
		}
		return updatedProduto
	}

	async delete(id: number): Promise<void> {
		const resultado = await this.produtoRepository.delete(id)

		if (resultado.affected === 0) {
			throw new NotFoundException(ErrorMessages.PRODUTO.NOT_FOUND)
		}
	}

	// Métodos Auxiliares

	private async validateCategoria(categoria: CategoriaIdDto) {
		if (!categoria?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}
		const buscaCategoria = await this.categoriaService.findById(categoria.id)
		if (!buscaCategoria)
			throw new BadRequestException(`${ErrorMessages.CATEGORIA.NOT_FOUND} (ID ${categoria.id})`)
	}

	private async validateEditora(editora: EditoraIdDto) {
		if (!editora?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}
		const buscaEditora = await this.editoraService.findById(editora.id)
		if (!buscaEditora) throw new BadRequestException(`${ErrorMessages.EDITORA.NOT_FOUND} (ID ${editora.id})`)
	}

	private async validateAutores(autores: AutorIdDto[]) {
		if (!autores || !Array.isArray(autores) || autores.length === 0) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_DATA)
		}
		const ids = autores.map(a => a.id)
		if (ids.some(id => !id)) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}
		const encontrados = await this.autorService.findAllByIds(ids)
		if (encontrados.length !== ids.length) {
			const encontradosIds = new Set(encontrados.map(a => a.id))
			const naoEncontrados = ids.filter(id => !encontradosIds.has(id))
			throw new BadRequestException(`${ErrorMessages.AUTHOR.NOT_FOUND} (ID(s) ${naoEncontrados.join(', ')})`)
		}
	}

	private handleSaveError(error: unknown): never {
		if (error instanceof QueryFailedError && typeof error.message === "string") {
			const msg = error.message.toLowerCase()
			if (msg.includes("unique") || msg.includes("constraint")) {
				if (msg.includes("isbn13")) {
					throw new BadRequestException(`${ErrorMessages.PRODUTO.ALREADY_EXISTS} (ISBN13)`)
				}
				if (msg.includes("isbn10")) {
					throw new BadRequestException(`${ErrorMessages.PRODUTO.ALREADY_EXISTS} (ISBN10)`)
				}
			}
		}
		throw error
	}

	private async processFotoFile(produto: Produto, fotoFile: Express.Multer.File) {
		const fotoUrl = await this.imageKitService.processarProdutoImage(
			produto.id,
			fotoFile,
			produto.foto,
		)
		if (fotoUrl) {
			produto.foto = fotoUrl
			await this.produtoRepository.save(produto)
		}
	}
}

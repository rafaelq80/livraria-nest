import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, Repository } from "typeorm"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Produto } from "../entities/produto.entity"
import { CategoriaService } from "./../../categoria/services/categoria.service"
import { EditoraService } from "./../../editora/services/editora.service"

@Injectable()
export class ProdutoService {
	private readonly logger = new Logger(ProdutoService.name)

	constructor(
		@InjectRepository(Produto)
		private produtoRepository: Repository<Produto>,
		private categoriaService: CategoriaService,
		private editoraService: EditoraService,
		private imagekitService: ImageKitService,
	) {}

	async findAll(): Promise<Produto[]> {
		return await this.produtoRepository.find({
			relations: {
				autores: true,
				categoria: true,
				editora: true,
			},
			order: {
				titulo: "ASC",
			},
			cache: true,
		})
	}

	async findById(id: number): Promise<Produto> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		const produto = await this.produtoRepository.findOne({
			where: {
				id,
			},
			relations: {
				autores: true,
				categoria: true,
				editora: true,
			},
		})

		if (!produto) throw new HttpException("Produto não encontrado!", HttpStatus.NOT_FOUND)

		return produto
	}

	async findByTitulo(titulo: string): Promise<Produto[]> {
		return await this.produtoRepository.find({
			where: {
				titulo: ILike(`%${titulo.trim()}%`),
			},
			relations: {
				autores: true,
				categoria: true,
				editora: true,
			},
			order: {
				titulo: "ASC",
			},
		})
	}

	async create(produto: Produto, foto: Express.Multer.File): Promise<Produto> {
		
		// Processar imagem se fornecida
		const fotoUrl = await this.processarImagem(produto, foto)
		if (fotoUrl) {
			produto.foto = fotoUrl
		}
		
		// Buscar categoria e editora
		const [categoria, editora] = await Promise.all([
			this.categoriaService.findById(produto.categoria.id),
			this.editoraService.findById(produto.editora.id),
		])

		produto.categoria = categoria
		produto.editora = editora

		const saveProduto = await this.produtoRepository.save(produto)

		return saveProduto
	}

	async update(produto: Produto, foto: Express.Multer.File): Promise<Produto> {
		if (!produto?.id) {
			throw new HttpException("Produto inválido!", HttpStatus.BAD_REQUEST)
		}

		// Verificar se o produto existe
		await this.findById(produto.id)

		// Processar imagem se fornecida
		const fotoUrl = await this.processarImagem(produto, foto)
		if (fotoUrl) {
			produto.foto = fotoUrl
		}

		// Buscar categoria e editora
		const [categoria, editora] = await Promise.all([
			this.categoriaService.findById(produto.categoria.id),
			this.editoraService.findById(produto.editora.id),
		])

		produto.categoria = categoria
		produto.editora = editora

		// Usar QueryRunner para transação
		const queryRunner = this.produtoRepository.manager.connection.createQueryRunner()
		await queryRunner.connect()
		await queryRunner.startTransaction()

		try {
			// 1. Atualizar dados básicos do produto
			await queryRunner.manager.update(Produto, produto.id, {
				titulo: produto.titulo,
				descricao: produto.descricao,
				preco: produto.preco,
				desconto: produto.desconto,
				isbn10: produto.isbn10,
				isbn13: produto.isbn13,
				paginas: produto.paginas,
				idioma: produto.idioma,
				foto: produto.foto,
				categoria: { id: categoria.id },
				editora: { id: editora.id },
			})

			// 2. Atualizar relacionamento com autores em uma única operação
			const produtoRepository = queryRunner.manager.getRepository(Produto)
			const produtoEntity = await produtoRepository.findOne({
				where: { id: produto.id },
				relations: { autores: true },
			})

			produtoEntity.autores = produto.autores || []
			await produtoRepository.save(produtoEntity)

			await queryRunner.commitTransaction()

			// Retornar produto atualizado
			return this.findById(produto.id)
		} catch (error) {
			await queryRunner.rollbackTransaction()
			this.logger.error(`Erro ao atualizar produto: ${error.message}`, error.stack)
			throw new HttpException(
				`Erro ao atualizar produto: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			)
		} finally {
			await queryRunner.release()
		}
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(id)

		return await this.produtoRepository.delete(id)
	}

	// Métodos Auxiliares

	private async processarImagem(
		produto: Produto,
		foto: Express.Multer.File,
	): Promise<string | null> {
		if (!foto) return null

		try {
			return await this.imagekitService.handleImage({
				file: foto,
				recurso: "produto",
				identificador: produto.id.toString(),
			})
		} catch (error) {
			this.logger.error(`Erro ao processar imagem: ${error.message}`, error.stack)
			return null
		}
	}

}

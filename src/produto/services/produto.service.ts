import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, Repository } from "typeorm"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Produto } from "../entities/produto.entity"
import { CategoriaService } from "./../../categoria/services/categoria.service"
import { EditoraService } from "./../../editora/services/editora.service"
import { Categoria } from "../../categoria/entities/categoria.entity"
import { Editora } from "../../editora/entities/editora.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class ProdutoService {
	constructor(
		@InjectRepository(Produto)
		private readonly produtoRepository: Repository<Produto>,
		private readonly categoriaService: CategoriaService,
		private readonly editoraService: EditoraService,
		private readonly imagekitService: ImageKitService,
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
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const produto = await this.produtoRepository.findOne({
			where: { id },
			relations: {
				autores: true,
				categoria: true,
				editora: true,
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
				autores: true,
				categoria: true,
				editora: true,
			},
			order: {
				titulo: "ASC",
			},
		})
	}

	async create(produto: Produto, fotoFile: Express.Multer.File): Promise<Produto> {
		const [categoria, editora] = await this.validarCategoriaEditora(produto);

		produto.categoria = categoria
		produto.editora = editora

		const produtoSalvo = await this.produtoRepository.save(produto)

		const fotoUrl = await this.processarImagem(produtoSalvo.id, fotoFile)
		if (fotoUrl) {
			produtoSalvo.foto = fotoUrl
			await this.produtoRepository.save(produtoSalvo)
		}

		return this.findById(produtoSalvo.id)
	}

	async update(produto: Produto, fotoFile?: Express.Multer.File): Promise<Produto> {
		if (!produto?.id) {
			throw new HttpException("Produto inválido!", HttpStatus.BAD_REQUEST)
		}

		await this.findById(produto.id)

		const [categoria, editora] = await this.validarCategoriaEditora(produto);

		produto.categoria = categoria
		produto.editora = editora

		const fotoUrl = await this.processarImagem(produto.id, fotoFile)
		if (fotoUrl) {
			produto.foto = fotoUrl
		}

		const queryRunner = this.produtoRepository.manager.connection.createQueryRunner()
		await queryRunner.connect()
		await queryRunner.startTransaction()

		try {
			await queryRunner.manager.update(Produto, produto.id, {
				titulo: produto.titulo,
				sinopse: produto.sinopse,
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

			const produtoRepository = queryRunner.manager.getRepository(Produto)
			const produtoEntity = await produtoRepository.findOne({
				where: { id: produto.id },
				relations: { autores: true },
			})

			if (produtoEntity) {
				produtoEntity.autores = produto.autores || []
				await produtoRepository.save(produtoEntity)
			}

			await queryRunner.commitTransaction()

			return this.findById(produto.id)
		} catch (error) {
			await queryRunner.rollbackTransaction()
			throw new HttpException(
				`Erro ao atualizar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
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

	private async validarCategoriaEditora(produto: Produto): Promise<[Categoria, Editora]> {
		if (!produto.categoria?.id) throw new BadRequestException("Categoria inválida")
		if (!produto.editora?.id) throw new BadRequestException("Editora inválida")

		return await Promise.all([
			this.categoriaService.findById(produto.categoria.id),
			this.editoraService.findById(produto.editora.id),
		])
	}

	private async processarImagem(
		produtoId: number,
		fotoFile?: Express.Multer.File,
	): Promise<string | null> {
		if (!fotoFile) return null

		try {
			return await this.imagekitService.handleImage({
				file: fotoFile,
				recurso: "produto",
				identificador: produtoId.toString(),
			})
		} catch {
			return null
		}
	}
}

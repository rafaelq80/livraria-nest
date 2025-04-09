import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, Repository } from "typeorm"
import { Autor } from "../../autor/entities/autor.entity"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Produto } from "../entities/produto.entity"
import { AutorService } from "./../../autor/services/autor.service"
import { CategoriaService } from "./../../categoria/services/categoria.service"
import { EditoraService } from "./../../editora/services/editora.service"

@Injectable()
export class ProdutoService {
	private readonly logger = new Logger(ProdutoService.name)

	constructor(
		@InjectRepository(Produto)
		private produtoRepository: Repository<Produto>,
		private autorService: AutorService,
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
		
    const fotoUrl = await this.imagekitService.handleImage({
			file: foto,
			recurso: "produto",
			identificador: produto.id.toString(),
		})

		if (fotoUrl) {
			produto.foto = fotoUrl
		}

		// Busca e atribui as instâncias corretas
		produto.categoria = await this.categoriaService.findById(produto.categoria.id)
		produto.editora = await this.editoraService.findById(produto.editora.id)

		const saveProduto = await this.produtoRepository.save(produto)

		return saveProduto
	}

	async update(produto: Produto, foto: Express.Multer.File): Promise<Produto> {
		if (!produto || !produto.id)
			throw new HttpException("Produto inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(produto.id)

    if (foto) {
			const fotoUrl = await this.imagekitService.handleImage({
				file: foto,
				recurso: "produto",
				identificador: produto.id.toString(),
			})
			if (fotoUrl) {
				produto.foto = fotoUrl
			}
		}


		// Busca e atribui as instâncias corretas
		produto.categoria = await this.categoriaService.findById(produto.categoria.id)
		produto.editora = await this.editoraService.findById(produto.editora.id)

		// Remove os Autores Atuais
		await this.removerAutoresProduto(produto.id)

		// Adiciona os novos Autores
		await this.adicionarAutoresProduto(produto.id, produto.autores)

		// Cria o Objeto de Atualização dos dados do Produto
		const updateData = {
			titulo: produto.titulo,
			preco: produto.preco,
			isbn10: produto.isbn10,
			isbn13: produto.isbn13,
			foto: produto.foto,
		}

		// Atualiza os dados do Produto
		await this.produtoRepository.update(produto.id, updateData)

		// Retorna os dados atualizados
		return this.findById(produto.id)
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(id)

		return await this.produtoRepository.delete(id)
	}

	// Métodos Auxiliares

	async removerAutoresProduto(id: number): Promise<void> {
		// Localiza todos os Autores do Produto
		const existingAutores = await this.produtoRepository
			.createQueryBuilder()
			.relation(Produto, "autores")
			.of(id)
			.loadMany()

		// Remove todos os Autores do Produto
		if (existingAutores.length > 0) {
			await this.produtoRepository
				.createQueryBuilder()
				.relation(Produto, "autores")
				.of(id)
				.remove(existingAutores)
		}
	}

	async adicionarAutoresProduto(id: number, autores: Autor[]): Promise<void> {
		// Valida os Autores antes de adicionar
		if (autores && autores.length > 0) {
			await this.autorService.validateAutores(autores)

			// Adiciona os novos Autores
			await this.produtoRepository
				.createQueryBuilder()
				.relation(Produto, "autores")
				.of(id)
				.add(autores)
		}
	}
}

import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, QueryRunner, Repository } from "typeorm"
import { AutorService } from "../../autor/services/autor.service"
import { ErrorMessages } from "../../common/constants/error-messages"
import { ImageKitService } from "../../imagekit/services/imagekit.service"
import { Produto } from "../entities/produto.entity"
import { CriarProdutoDto } from "../dtos/criarproduto.dto"
import { AtualizarProdutoDto } from "../dtos/atualizarproduto.dto"
import { CategoriaService } from "../../categoria/services/categoria.service"
import { EditoraService } from "../../editora/services/editora.service"

@Injectable()
export class ProdutoService {
	private readonly logger = new Logger(ProdutoService.name)

	constructor(
		@InjectRepository(Produto)
		private readonly produtoRepository: Repository<Produto>,
		private readonly imageKitService: ImageKitService,
		private readonly categoriaService: CategoriaService,
		private readonly editoraService: EditoraService,
		private readonly autorService: AutorService
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

		if (!produto) throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)

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
				titulo: 'ASC',
			},
		})
	}

	async create(produtoDto: CriarProdutoDto, fotoFile?: Express.Multer.File): Promise<Produto> {
		this.logger.log('=== INICIANDO CRIAÇÃO DE PRODUTO ===')
		this.logger.log('DTO recebido: ' + JSON.stringify(produtoDto, null, 2))
		this.logger.log('Arquivo de foto: ' + (fotoFile ? JSON.stringify({
			fieldname: fotoFile.fieldname,
			originalname: fotoFile.originalname,
			mimetype: fotoFile.mimetype,
			size: fotoFile.size
		}, null, 2) : 'null'))

		// Validar categoria e editora
		await this.validarCategoriaEEditora(produtoDto.categoria.id, produtoDto.editora.id);

		// Validar autores
		for (const autor of produtoDto.autores) {
			try {
				await this.autorService.findById(autor.id);
			} catch {
				throw new BadRequestException(`Autor com ID ${autor.id} não encontrado`);
			}
		}

		const produto = this.produtoRepository.create(produtoDto);
		this.logger.log('Produto criado: ' + JSON.stringify(produto, null, 2))

		if (fotoFile) {
			this.logger.log('Iniciando upload da foto...')
			const fotoUrl = await this.imageKitService.handleImage({
				file: fotoFile,
				recurso: "produto",
				identificador: produto.id.toString()
			});
			this.logger.log('Upload concluído: ' + fotoUrl)
			produto.foto = fotoUrl;
		}

		const savedProduto = await this.produtoRepository.save(produto);
		this.logger.log('Produto salvo: ' + JSON.stringify(savedProduto, null, 2))
		this.logger.log('=== CRIAÇÃO DE PRODUTO CONCLUÍDA ===')
		return savedProduto;
	}

	async update(produtoDto: AtualizarProdutoDto, fotoFile?: Express.Multer.File): Promise<Produto> {
		this.logger.log('=== INICIANDO ATUALIZAÇÃO DE PRODUTO ===')
		this.logger.log('ID: ' + produtoDto.id)
		this.logger.log('DTO recebido: ' + JSON.stringify(produtoDto, null, 2))
		this.logger.log('Arquivo de foto: ' + (fotoFile ? JSON.stringify({
			fieldname: fotoFile.fieldname,
			originalname: fotoFile.originalname,
			mimetype: fotoFile.mimetype,
			size: fotoFile.size
		}, null, 2) : 'null'))

		const produto = await this.findById(produtoDto.id);
		this.logger.log('Produto encontrado: ' + JSON.stringify(produto, null, 2))

		// Validar categoria e editora se fornecidas
		if (produtoDto.categoria?.id) {
			await this.validarCategoriaEEditora(produtoDto.categoria.id, produto.editora.id);
		}
		if (produtoDto.editora?.id) {
			await this.validarCategoriaEEditora(produto.categoria.id, produtoDto.editora.id);
		}

		// Validar autores se fornecidos
		if (produtoDto.autores) {
			for (const autor of produtoDto.autores) {
				try {
					await this.autorService.findById(autor.id);
				} catch {
					throw new BadRequestException(`Autor com ID ${autor.id} não encontrado`);
				}
			}
		}

		if (fotoFile) {
			this.logger.log('Iniciando upload da nova foto...')
			const fotoUrl = await this.imageKitService.handleImage({
				file: fotoFile,
				recurso: "produto",
				identificador: produto.id.toString(),
				oldImageUrl: produto.foto
			});
			this.logger.log('Upload concluído: ' + fotoUrl)
			produtoDto.foto = fotoUrl;
		}

		Object.assign(produto, produtoDto);
		this.logger.log('Produto atualizado: ' + JSON.stringify(produto, null, 2))

		const updatedProduto = await this.produtoRepository.save(produto);
		this.logger.log('Produto salvo: ' + JSON.stringify(updatedProduto, null, 2))
		this.logger.log('=== ATUALIZAÇÃO DE PRODUTO CONCLUÍDA ===')
		return updatedProduto;
	}

	async delete(id: number): Promise<void> {
		const result = await this.produtoRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.USER.NOT_FOUND)
		}
	}

	// Métodos Auxiliares

	private async validarCategoriaEEditora(categoriaId: number, editoraId: number): Promise<void> {
		try {
			await this.categoriaService.findById(categoriaId);
		} catch {
			throw new BadRequestException(`Categoria com ID ${categoriaId} não encontrada`);
		}

		try {
			await this.editoraService.findById(editoraId);
		} catch {
			throw new BadRequestException(`Editora com ID ${editoraId} não encontrada`);
		}
	}

	private async atualizarFotoSeNecessario(
		produto: Produto,
		fotoFile: Express.Multer.File | undefined,
		produtoAtual: Produto,
	): Promise<string | undefined> {
		const fotoUrl = await this.processarImagem(produto, fotoFile)
		if (fotoUrl) return fotoUrl
		return produto.foto ?? produtoAtual.foto
	}

	private prepararDadosAtualizacao(produto: Produto): Partial<Produto> {
		const updateData: Partial<Produto> = {}
		if (produto.titulo !== undefined) updateData.titulo = produto.titulo
		if (produto.sinopse !== undefined) updateData.sinopse = produto.sinopse
		if (produto.preco!== undefined) updateData.preco = produto.preco
		if (produto.desconto!== undefined) updateData.desconto = produto.desconto
		if (produto.isbn10!== undefined) updateData.isbn10 = produto.isbn10	
		if (produto.isbn13!== undefined) updateData.isbn13 = produto.isbn13	
		if (produto.paginas!== undefined) updateData.paginas = produto.paginas	
		if (produto.anoPublicacao!== undefined) updateData.anoPublicacao = produto.anoPublicacao	
		if (produto.edicao!== undefined) updateData.edicao = produto.edicao	
		if (produto.idioma!== undefined) updateData.idioma = produto.idioma	
		return updateData
	}

	private async atualizarAutoresSeNecessario(
		queryRunner: QueryRunner,
		produto: Produto,
	): Promise<void> {
		if (produto.autores !== undefined) {
			const produtoEntity = await queryRunner.manager.findOne(Produto, {
				where: { id: produto.id },
				relations: { autores: true },
			})
			if (produtoEntity) {
				produtoEntity.autores = produto.autores || []
				await queryRunner.manager.save(Produto, produtoEntity)
			}
		}
	}

	private async tratarErro(queryRunner: QueryRunner, error: unknown): Promise<void> {
		if (queryRunner.isTransactionActive) {
			await queryRunner.rollbackTransaction()
		}

		this.logger.error(
			`Erro ao atualizar produto: ${(error as Error).message}`,
			(error as Error).stack,
		)
		throw new BadRequestException(
			`Erro ao atualizar produto: ${(error as Error).message}`
		)
	}

	private async processarImagem(
		produto: Produto,
		foto: Express.Multer.File,
	): Promise<string | null> {
		if (!foto) return null

		try {
			return await this.imageKitService.handleImage({
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

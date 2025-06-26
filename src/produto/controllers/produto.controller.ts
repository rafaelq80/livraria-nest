import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	Param,
	ParseIntPipe,
	Post,
	Put,
	UseGuards,
	UseInterceptors
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { AtualizarProdutoDto } from "../dtos/atualizarproduto.dto"
import { CriarProdutoDto } from "../dtos/criarproduto.dto"
import { ProdutoService } from "../services/produto.service"
import { UseImageKit } from "../../imagekit/decorators/imagekit.decorator"
import { ValidatedImage } from "../../imagekit/decorators/image-validation.decorator"
import { Public } from "../../security/decorators/public.decorator"

@ApiTags("Produtos")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller("/produtos")
export class ProdutoController {
	private readonly logger = new Logger(ProdutoController.name)

	constructor(private readonly produtoService: ProdutoService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@Public()
	@ApiResponse({
		status: 200,
		description: "Produtos encontrados.",
		schema: {
			example: {
				status: "success",
				message: "Produtos encontrados.",
				data: [
					{
						id: 1,
						titulo: "Livro Teste",
						sinopse: "Sinopse do livro",
						paginas: 100,
						anoPublicacao: 2022,
						preco: 50.0,
						idioma: "Português",
						isbn10: "1234567890",
						isbn13: "1234567890123",
						desconto: 0,
						edicao: 1,
						categoria: { id: 1, tipo: "Ficção" },
						editora: { id: 1, nome: "Editora Teste" },
						autores: [{ id: 1, nome: "Autor Teste" }],
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				],
			},
		},
	})
	async findAll() {
		const produtos = await this.produtoService.findAll()
		return {
			status: "success",
			message: "Produtos encontrados.",
			data: produtos,
		}
	}

	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	@Public()
	@ApiResponse({
		status: 200,
		description: "Produto encontrado.",
		schema: {
			example: {
				status: "success",
				message: "Produto encontrado.",
				data: {
					id: 1,
					titulo: "Livro Teste",
					sinopse: "Sinopse do livro",
					paginas: 100,
					anoPublicacao: 2022,
					preco: 50.0,
					idioma: "Português",
					isbn10: "1234567890",
					isbn13: "1234567890123",
					desconto: 0,
					edicao: 1,
					categoria: { id: 1, tipo: "Ficção" },
					editora: { id: 1, nome: "Editora Teste" },
					autores: [{ id: 1, nome: "Autor Teste" }],
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			},
		},
	})
	async findById(@Param("id", ParseIntPipe) id: number) {
		const produto = await this.produtoService.findById(id)
		return {
			status: "success",
			message: "Produto encontrado.",
			data: produto,
		}
	}

	@Get("/titulo/:titulo")
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		status: 200,
		description: "Produtos encontrados por título.",
		schema: {
			example: {
				status: "success",
				message: "Produtos encontrados por título.",
				data: [
					{
						id: 1,
						titulo: "Livro Teste",
						sinopse: "Sinopse do livro",
						paginas: 100,
						anoPublicacao: 2022,
						preco: 50.0,
						idioma: "Português",
						isbn10: "1234567890",
						isbn13: "1234567890123",
						desconto: 0,
						edicao: 1,
						categoria: { id: 1, tipo: "Ficção" },
						editora: { id: 1, nome: "Editora Teste" },
						autores: [{ id: 1, nome: "Autor Teste" }],
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				],
			},
		},
	})
	async findByTitulo(@Param("titulo") titulo: string) {
		const produtos = await this.produtoService.findAllByTitulo(titulo)
		return {
			status: "success",
			message: "Produtos encontrados por título.",
			data: produtos,
		}
	}

	@Post()
	@ApiConsumes('multipart/form-data')
	@UseImageKit()
	@UseInterceptors(FileInterceptor('fotoFile'))
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard)
	async create(
		@Body() produtoDto: CriarProdutoDto,
		@ValidatedImage() fotoFile?: Express.Multer.File,
	) {
		const produto = await this.produtoService.create(produtoDto, fotoFile)
		return {
			status: "success",
			message: "Produto criado com sucesso.",
			data: produto,
		}
	}

	@Put()
	@ApiConsumes('multipart/form-data')
	@UseImageKit()
	@UseInterceptors(FileInterceptor('fotoFile'))
	@HttpCode(HttpStatus.OK)
	@UseGuards(JwtAuthGuard)
	async update(
		@Body() produtoDto: AtualizarProdutoDto,
		@ValidatedImage({ validateDimensions: true }) fotoFile?: Express.Multer.File,
	) {
		const produto = await this.produtoService.update(produtoDto, fotoFile)
		return {
			status: "success",
			message: "Produto atualizado com sucesso.",
			data: produto,
		}
	}

	@Delete("/:id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(JwtAuthGuard)
	async delete(@Param("id", ParseIntPipe) id: number) {
		await this.produtoService.delete(id)
	}
}

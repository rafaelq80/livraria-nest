import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { AutorService } from "../../autor/services/autor.service"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { Produto } from "../entities/produto.entity"
import { ProdutoService } from "../services/produto.service"

@ApiTags("Produto")
@ApiBearerAuth()
@Controller("/produtos")
export class ProdutoController {
	constructor(
		private readonly produtoService: ProdutoService,
		private readonly autorService: AutorService,
	) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	findAll(): Promise<Produto[]> {
		return this.produtoService.findAll()
	}

	@UseGuards(JwtAuthGuard)
	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	findById(@Param("id", ParseIntPipe) id: number): Promise<Produto> {
		return this.produtoService.findById(id)
	}

	@UseGuards(JwtAuthGuard)
	@Get("/titulo/:titulo")
	@HttpCode(HttpStatus.OK)
	findByTitulo(@Param("titulo") titulo: string): Promise<Produto[]> {
		return this.produtoService.findByTitulo(titulo)
	}
	@UseGuards(JwtAuthGuard)
	@Post()
	@UseInterceptors(FileInterceptor("foto"))
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() produto: Produto,
		@UploadedFile() foto: Express.Multer.File,
	): Promise<Produto> {
		if (!foto || !foto.originalname) {
			throw new BadRequestException("Arquivo de imagem não enviado ou inválido.")
		}
		const produtoAutores = await this.autorService.processarAutores(produto)

		return this.produtoService.create(produtoAutores, foto)
	}

	@UseGuards(JwtAuthGuard)
	@Put()
	@UseInterceptors(FileInterceptor("foto"))
	@HttpCode(HttpStatus.OK)
	async update(
		@Body() produto: Produto,
		@UploadedFile() foto?: Express.Multer.File,
	): Promise<Produto> {
		const produtoAutores = await this.autorService.processarAutores(produto)

		return this.produtoService.update(produtoAutores, foto)
	}

	@UseGuards(JwtAuthGuard)
	@Delete("/:id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(@Param("id", ParseIntPipe) id: number) {
		return this.produtoService.delete(id)
	}
}

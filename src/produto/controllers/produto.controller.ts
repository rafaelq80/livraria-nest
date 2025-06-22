import {
	Body,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger"
import { ValidatedImage } from "../../imagekit/decorators/image-validation.decorator"
import { UseImageKit } from "../../imagekit/decorators/imagekit.decorator"
import { Public } from "../../security/decorators/public.decorator"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { AtualizarProdutoDto } from "../dtos/atualizarproduto.dto"
import { CriarProdutoDto } from "../dtos/criarproduto.dto"
import { Produto } from "../entities/produto.entity"
import { ProdutoService } from "../services/produto.service"

@ApiTags("Produtos")
@ApiBearerAuth()
@Controller("/produtos")
export class ProdutoController {
	private readonly logger = new Logger(ProdutoController.name)

	constructor(
		private readonly produtoService: ProdutoService,
	) {}


	@Public()
	@Get()
	@ApiOperation({ summary: 'Listar todos os produtos' })
	@ApiResponse({ status: 200, description: 'Lista de produtos retornada com sucesso', type: [Produto] })
	async findAll(): Promise<Produto[]> {
		return await this.produtoService.findAll()
	}

	@Get("/:id")
	@ApiOperation({ summary: 'Buscar produto por ID' })
	@ApiParam({ name: 'id', description: 'ID do produto', type: 'number' })
	@ApiResponse({ status: 200, description: 'Produto encontrado com sucesso', type: Produto })
	@ApiResponse({ status: 404, description: 'Produto não encontrado' })
	async findById(@Param("id", ParseIntPipe) id: number): Promise<Produto> {
		return await this.produtoService.findById(id)
	}

	@Get("/titulo/:titulo")
	@ApiOperation({ summary: 'Buscar produtos por título' })
	@ApiQuery({ name: 'titulo', description: 'Título do produto para busca', required: true })
	@ApiResponse({ status: 200, description: 'Produtos encontrados com sucesso', type: [Produto] })
	async findAllByTitulo(@Param('titulo') titulo: string): Promise<Produto[]> {
		return await this.produtoService.findAllByTitulo(titulo)
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Criar um novo produto' })
	@ApiResponse({ status: 201, description: 'Produto criado com sucesso', type: Produto })
	@ApiResponse({ status: 400, description: 'Dados inválidos' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CriarProdutoDto })
	@UseImageKit()
	@UseInterceptors(FileInterceptor("fotoFile"))
	async create(
		@Body() produtoDto: CriarProdutoDto,
		@ValidatedImage({ validateDimensions: true }) fotoFile?: Express.Multer.File,
	): Promise<Produto> {
		return await this.produtoService.create(produtoDto, fotoFile);
	}

	@Put()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Atualizar um produto existente' })
	@ApiResponse({ status: 200, description: 'Produto atualizado com sucesso', type: Produto })
	@ApiResponse({ status: 400, description: 'Dados inválidos' })
	@ApiResponse({ status: 404, description: 'Produto não encontrado' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: AtualizarProdutoDto })
	@UseImageKit()
	@UseInterceptors(FileInterceptor('fotoFile'))
	async update(
		@Body() produtoDto: AtualizarProdutoDto,
		@ValidatedImage({ validateDimensions: true }) fotoFile?: Express.Multer.File
	): Promise<Produto> {
		return await this.produtoService.update(produtoDto, fotoFile)
	}

	@Delete("/:id")
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Remover um produto' })
	@ApiParam({ name: 'id', description: 'ID do produto', type: 'number' })
	@ApiResponse({ status: 204, description: 'Produto removido com sucesso' })
	@ApiResponse({ status: 404, description: 'Produto não encontrado' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
		await this.produtoService.delete(id)
	}
}
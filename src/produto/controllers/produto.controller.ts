import {
	Body,
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiConsumes, ApiBody } from "@nestjs/swagger"
import { plainToInstance } from "class-transformer"
import { AutorService } from "../../autor/services/autor.service"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { CriarProdutoDto } from "../dtos/criarproduto.dto"
import { Produto } from "../entities/produto.entity"
import { ProdutoService } from "../services/produto.service"
import { AtualizarProdutoDto } from "../dtos/atualizarproduto.dto"

@ApiTags("Produtos")
@ApiBearerAuth()
@Controller("/produtos")
export class ProdutoController {
	private readonly logger = new Logger(ProdutoController.name)

	constructor(
		private readonly produtoService: ProdutoService,
		private readonly autorService: AutorService,
	) {}


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
	async findAllByTitulo(@Query('titulo') titulo: string): Promise<Produto[]> {
		return await this.produtoService.findAllByTitulo(titulo)
	}

	@Post()
	@UseInterceptors(FileInterceptor("fotoFile"))
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Criar um novo produto' })
	@ApiResponse({ status: 201, description: 'Produto criado com sucesso', type: Produto })
	@ApiResponse({ status: 400, description: 'Dados inválidos' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CriarProdutoDto })
	async create(
		@Body() produtoDto: CriarProdutoDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
				],
				fileIsRequired: false
			}),
		)
		fotoFile?: Express.Multer.File,
	): Promise<Produto> {
		this.logger.log('=== DADOS RECEBIDOS NO CONTROLLER ===')
		this.logger.log('DTO: ' + JSON.stringify(produtoDto, null, 2))
		this.logger.log('Foto: ' + (fotoFile ? JSON.stringify({
			fieldname: fotoFile.fieldname,
			originalname: fotoFile.originalname,
			mimetype: fotoFile.mimetype,
			size: fotoFile.size
		}, null, 2) : 'null'))
		this.logger.log('================================')

		const produto = plainToInstance(Produto, produtoDto);
		this.logger.log('Produto após conversão: ' + JSON.stringify(produto, null, 2))
		return await this.produtoService.create(produto, fotoFile);
	}

	@Put()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Atualizar um produto existente' })
	@ApiResponse({ status: 200, description: 'Produto atualizado com sucesso', type: Produto })
	@ApiResponse({ status: 400, description: 'Dados inválidos' })
	@ApiResponse({ status: 404, description: 'Produto não encontrado' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: AtualizarProdutoDto })
	@UseInterceptors(FileInterceptor('fotoFile'))
	async update(
		@Body() produtoDto: AtualizarProdutoDto,
		@UploadedFile() fotoFile?: Express.Multer.File
	): Promise<Produto> {
		const produto = plainToInstance(Produto, produtoDto);
		return await this.produtoService.update(produto, fotoFile)
	}

	@Delete("/:id")
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Remover um produto' })
	@ApiParam({ name: 'id', description: 'ID do produto', type: 'number' })
	@ApiResponse({ status: 200, description: 'Produto removido com sucesso' })
	@ApiResponse({ status: 404, description: 'Produto não encontrado' })
	async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
		await this.produtoService.delete(id)
	}
}
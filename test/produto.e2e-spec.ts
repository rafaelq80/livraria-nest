import { ExecutionContext, INestApplication, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { Repository } from "typeorm"
import { Autor } from "../src/autor/entities/autor.entity"
import { AutorService } from "../src/autor/services/autor.service"
import { Categoria } from "../src/categoria/entities/categoria.entity"
import { CategoriaService } from "../src/categoria/services/categoria.service"
import { Editora } from "../src/editora/entities/editora.entity"
import { EditoraService } from "../src/editora/services/editora.service"
import { ImageKitService } from "../src/imagekit/services/imagekit.service"
import { ProdutoController } from "../src/produto/controllers/produto.controller"
import { Produto } from "../src/produto/entities/produto.entity"
import { ProdutoService } from "../src/produto/services/produto.service"
import { JwtAuthGuard } from "../src/security/guards/jwt-auth.guard"

describe("ProdutoController (e2e)", () => {
	let app: INestApplication
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let produtoRepository: Repository<Produto>
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let jwtService: JwtService

	// Mock Data
	const mockAutor: Autor = {
		id: 1,
		nome: "Machado de Assis",
		nacionalidade: "Brasileira",
		createdAt: new Date(),
		updatedAt: new Date(),
		produtos: [],
	}

	const mockCategoria: Categoria = {
		id: 1,
		tipo: "Literatura Brasileira",
		createdAt: new Date(),
		updatedAt: new Date(),
		produtos: [],
	}

	const mockEditora: Editora = {
		id: 1,
		nome: "Companhia das Letras",
		createdAt: new Date(),
		updatedAt: new Date(),
		produtos: [],
	}

	const mockProduto: Produto = {
		id: 1,
		titulo: "Dom Casmurro",
		descricao: "Clássico da literatura brasileira",
		preco: 29.99,
		desconto: 10,
		foto: "https://example.com/foto.jpg",
		paginas: 200,
		idioma: "Português",
		isbn10: "0306406152",
		isbn13: "9783161484100",
		createdAt: new Date(),
		updatedAt: new Date(),
		autores: [mockAutor],
		categoria: mockCategoria,
		editora: mockEditora,
		get precoComDesconto() {
			return this.preco * (1 - this.desconto / 100)
		},
		get temDesconto() {
			return this.desconto > 0
		},
	}

	// Mocks
	const mockProdutoRepository = {
		find: jest.fn(),
		findOne: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		manager: {
			connection: {
				createQueryRunner: jest.fn(() => ({
					connect: jest.fn(),
					startTransaction: jest.fn(),
					commitTransaction: jest.fn(),
					rollbackTransaction: jest.fn(),
					release: jest.fn(),
					manager: {
						update: jest.fn(),
						getRepository: jest.fn(() => ({
							findOne: jest.fn(),
							save: jest.fn(),
						})),
					},
				})),
			},
		},
	}

	const mockAutorService = {
		processarAutores: jest.fn().mockResolvedValue([mockAutor]),
	}

	const mockCategoriaService = {
		findById: jest.fn().mockResolvedValue(mockCategoria),
	}

	const mockEditoraService = {
		findById: jest.fn().mockResolvedValue(mockEditora),
	}

	const mockImageKitService = {
		handleImage: jest.fn().mockResolvedValue("https://imagekit.io/uploaded-image.jpg"),
	}

	const mockJwtService = {
		sign: jest.fn().mockReturnValue("mock-jwt-token"),
		verify: jest.fn().mockReturnValue({ sub: 1, username: "testuser" }),
	}

	// Mock JWT Guard
	const canActivateMock = jest.fn((context: ExecutionContext) => {
		const req = context.switchToHttp().getRequest()
		req.user = { userId: 1, username: "admin" } // Simula usuário autenticado
		return true
	})

	const mockJwtAuthGuard = {
		canActivate: canActivateMock,
	}

	// Funções auxiliares para configurar comportamentos do mock
	const mockAuthSuccess = () => {
		canActivateMock.mockImplementation((context: ExecutionContext) => {
			const req = context.switchToHttp().getRequest()
			req.user = { userId: 1, username: "admin" }
			return true
		})
	}

	const mockAuthUnauthorized = (message = "Token inválido ou ausente") => {
		canActivateMock.mockImplementation(() => {
			throw new UnauthorizedException(message)
		})
	}

	const mockAuthForbidden = () => {
		canActivateMock.mockImplementation(() => {
			return false // Retorna 403 - usuário autenticado mas sem permissão
		})
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProdutoController],
			providers: [
				ProdutoService,
				{
					provide: getRepositoryToken(Produto),
					useValue: mockProdutoRepository,
				},
				{
					provide: AutorService,
					useValue: mockAutorService,
				},
				{
					provide: CategoriaService,
					useValue: mockCategoriaService,
				},
				{
					provide: EditoraService,
					useValue: mockEditoraService,
				},
				{
					provide: ImageKitService,
					useValue: mockImageKitService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue(mockJwtAuthGuard)
			.compile()

		app = module.createNestApplication()
		app.useLogger(false)
		await app.init()

		mockAuthSuccess()

		produtoRepository = module.get<Repository<Produto>>(getRepositoryToken(Produto))
		jwtService = module.get<JwtService>(JwtService)
	})

	afterEach(async () => {
		await app.close()
		jest.clearAllMocks()
	})

	describe("GET /produtos", () => {
		it("should return all produtos", async () => {
			mockProdutoRepository.find.mockResolvedValue([mockProduto])

			const response = await request(app.getHttpServer()).get("/produtos").expect(200)

			expect(response.body).toHaveLength(1)
			expect(response.body[0]).toMatchObject({
				id: mockProduto.id,
				titulo: mockProduto.titulo,
				preco: mockProduto.preco,
			})
			expect(mockProdutoRepository.find).toHaveBeenCalledWith({
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
		})

		it("should return empty array when no produtos exist", async () => {
			mockProdutoRepository.find.mockResolvedValue([])

			const response = await request(app.getHttpServer()).get("/produtos").expect(200)

			expect(response.body).toHaveLength(0)
		})
	})

	describe("GET /produtos/:id", () => {
		it("should return produto by id", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(mockProduto)

			const response = await request(app.getHttpServer()).get("/produtos/1").expect(200)

			expect(response.body).toMatchObject({
				id: mockProduto.id,
				titulo: mockProduto.titulo,
				preco: mockProduto.preco,
			})
			expect(mockProdutoRepository.findOne).toHaveBeenCalledWith({
				where: { id: 1 },
				relations: {
					autores: true,
					categoria: true,
					editora: true,
				},
			})
		})

		it("should return 404 when produto not found", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(null)

			await request(app.getHttpServer()).get("/produtos/999").expect(404)
		})

		it("should return 400 for invalid id", async () => {
			await request(app.getHttpServer()).get("/produtos/0").expect(400)
		})
	})

	describe("GET /produtos/titulo/:titulo", () => {
		it("should return produtos by titulo", async () => {
			mockProdutoRepository.find.mockResolvedValue([mockProduto])

			const response = await request(app.getHttpServer())
				.get("/produtos/titulo/Dom")
				.set("Authorization", "Bearer mock-token")
				.expect(200)

			expect(response.body).toHaveLength(1)
			expect(response.body[0].titulo).toContain("Dom")
			expect(mockJwtAuthGuard.canActivate).toHaveBeenCalled()
		})

		it("should return 401 when token is invalid or missing", async () => {
			mockAuthUnauthorized("Token inválido") // Simula token inválido

			await request(app.getHttpServer()).get("/produtos/titulo/Dom").expect(401)
		})

		it("should return 403 when user is authenticated but lacks permission", async () => {
			mockAuthForbidden() // Simula usuário autenticado mas sem permissão

			await request(app.getHttpServer())
				.get("/produtos/titulo/Dom")
				.set("Authorization", "Bearer valid-but-insufficient-token")
				.expect(403)
		})
	})

	describe("POST /produtos", () => {
		const novoProduto = {
			titulo: "Novo Livro",
			descricao: "Descrição do novo livro",
			preco: 39.99,
			desconto: 0,
			categoria: { id: 1 },
			editora: { id: 1 },
			autores: [{ id: 1 }],
		}

		it("should create a new produto", async () => {
			const produtoSalvo = { ...mockProduto, ...novoProduto }
			mockProdutoRepository.save.mockResolvedValue(produtoSalvo)
			mockProdutoRepository.findOne.mockResolvedValue(produtoSalvo)

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(201)

			expect(response.body).toMatchObject({
				titulo: novoProduto.titulo,
				preco: novoProduto.preco,
			})
			expect(mockAutorService.processarAutores).toHaveBeenCalled()
			expect(mockCategoriaService.findById).toHaveBeenCalledWith(1)
			expect(mockEditoraService.findById).toHaveBeenCalledWith(1)
		})

		it("should create produto with image file", async () => {
			const produtoSalvo = { ...mockProduto, ...novoProduto }
			mockProdutoRepository.save.mockResolvedValue(produtoSalvo)
			mockProdutoRepository.findOne.mockResolvedValue(produtoSalvo)

			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake image"), "test.jpg")
				.expect(201)

			expect(mockImageKitService.handleImage).toHaveBeenCalled()
		})

		it("should require authentication", async () => {
			mockAuthUnauthorized("Token inválido")

			await request(app.getHttpServer()).post("/produtos").send(novoProduto).expect(401)
		})

		it("should validate required fields", async () => {
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(400)
		})
	})

	describe("PUT /produtos", () => {
		const produtoAtualizado = {
			id: 1,
			titulo: "Título Atualizado",
			descricao: "Descrição atualizada",
			preco: 49.99,
			desconto: 15,
			categoria: { id: 1 },
			editora: { id: 1 },
			autores: [{ id: 1 }],
		}

		it("should update existing produto", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(mockProduto)
			const queryRunner = mockProdutoRepository.manager.connection.createQueryRunner()
			queryRunner.manager.getRepository().findOne.mockResolvedValue(mockProduto)

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoAtualizado)
				.expect(200)

			expect(mockAutorService.processarAutores).toHaveBeenCalled()
			expect(mockCategoriaService.findById).toHaveBeenCalledWith(1)
			expect(mockEditoraService.findById).toHaveBeenCalledWith(1)
		})

		it("should update produto with image file", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(mockProduto)
			const queryRunner = mockProdutoRepository.manager.connection.createQueryRunner()
			queryRunner.manager.getRepository().findOne.mockResolvedValue(mockProduto)

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("id", "1")
				.field("titulo", produtoAtualizado.titulo)
				.field("preco", produtoAtualizado.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake updated image"), "updated.jpg")
				.expect(200)

			expect(mockImageKitService.handleImage).toHaveBeenCalled()
		})

		it("should require authentication", async () => {
			mockAuthUnauthorized("Token inválido")

			await request(app.getHttpServer()).put("/produtos").send(produtoAtualizado).expect(401)
		})

		it("should return 400 for invalid produto", async () => {
			await request(app.getHttpServer()).put("/produtos").send({}).expect(400)
		})

		it("should return 404 when produto not found", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(null)

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoAtualizado)
				.expect(404)
		})
	})

	describe("DELETE /produtos/:id", () => {
		it("should delete produto by id", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(mockProduto)
			mockProdutoRepository.delete.mockResolvedValue({ affected: 1, raw: {} })

			await request(app.getHttpServer())
				.delete("/produtos/1")
				.set("Authorization", "Bearer mock-token")
				.expect(204)

			expect(mockProdutoRepository.delete).toHaveBeenCalledWith(1)
		})

		it("should require authentication", async () => {
			mockAuthUnauthorized("Token inválido")

			await request(app.getHttpServer())
				//.set('Authorization', 'Bearer fake-jwt-token')
				.delete("/produtos/1")
				.expect(401)
		})

		it("should return 400 for invalid id", async () => {
			await request(app.getHttpServer())
				.delete("/produtos/0")
				.set("Authorization", "Bearer mock-token")
				.expect(400)
		})

		it("should return 404 when produto not found", async () => {
			mockProdutoRepository.findOne.mockResolvedValue(null)

			await request(app.getHttpServer())
				.delete("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(404)
		})
	})

	describe("File Upload Validations", () => {
		const novoProduto = {
			titulo: "Livro com Imagem",
			preco: 29.99,
			categoria: { id: 1 },
			editora: { id: 1 },
		}

		it("should reject files larger than 5MB", async () => {
			const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB

			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", largeBuffer, "large.jpg")
				.expect(400)
		})

		it("should reject invalid file types", async () => {
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake file"), "document.pdf")
				.expect(400)
		})

		it("should accept valid image files", async () => {
			const produtoSalvo = { ...mockProduto, ...novoProduto }
			mockProdutoRepository.save.mockResolvedValue(produtoSalvo)
			mockProdutoRepository.findOne.mockResolvedValue(produtoSalvo)

			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake image"), "image.png")
				.expect(201)
		})
	})

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			mockProdutoRepository.find.mockRejectedValue(new Error("Database connection failed"))

			const response = await request(app.getHttpServer()).get("/produtos").expect(500)

			// Verificar que a resposta contém uma mensagem de erro apropriada
			expect(response.body).toHaveProperty("message")
			expect(response.body.statusCode).toBe(500)
		})

		it("should handle image upload service errors", async () => {
			mockImageKitService.handleImage.mockRejectedValue(new Error("Upload failed"))

			const novoProduto = {
				titulo: "Livro Teste",
				preco: 29.99,
				categoria: { id: 1 },
				editora: { id: 1 },
			}

			const produtoSalvo = { ...mockProduto, ...novoProduto, foto: null }
			mockProdutoRepository.save.mockResolvedValue(produtoSalvo)
			mockProdutoRepository.findOne.mockResolvedValue(produtoSalvo)

			// O serviço deve continuar funcionando mesmo se o upload da imagem falhar
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake image"), "test.jpg")
				.expect(201)
		})
	})
})

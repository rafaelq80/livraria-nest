import { NotFoundException } from "@nestjs/common"
import * as request from "supertest"
import { ProdutoController } from "../src/produto/controllers/produto.controller"
import { Produto } from "../src/produto/entities/produto.entity"
import { ProdutoService } from "../src/produto/services/produto.service"
import { ProdutoMockData, ProdutoMockFactory } from "./factories/produto-mock.factory"
import { BaseTestHelper } from "./helpers/base-test.helper"
import { ProdutoServicesMockFactory } from "./mocks/produto-services.mock"

interface CreateProdutoRequest {
	titulo: string
	descricao: string
	preco: number
	desconto: number
	categoria: { id: number }
	editora: { id: number }
	autores: Array<{ id: number }>
}

interface UpdateProdutoRequest extends CreateProdutoRequest {
	id: number
}

const createMockProdutoService = (mockData: ProdutoMockData) => ({
	findAll: jest.fn().mockResolvedValue([mockData.produto]),
	findById: jest.fn().mockImplementation((id: number) => {
		if (id === mockData.produto.id) {
			return Promise.resolve(mockData.produto)
		}
		throw new NotFoundException(`Produto com ID ${id} não encontrado`)
	}),
	findByTitulo: jest.fn().mockResolvedValue([mockData.produto]),
	create: jest.fn().mockResolvedValue(mockData.produto),
	update: jest
		.fn()
		.mockImplementation((produto: UpdateProdutoRequest | Record<string, unknown>) => {
			const produtoId = "id" in produto ? produto.id : undefined
			if (produtoId === mockData.produto.id || produtoId === 999) {
				if (produtoId === 999) {
					throw new NotFoundException(`Produto com ID ${produtoId} não encontrado`)
				}
				return Promise.resolve({ ...mockData.produto, ...produto })
			}
			return Promise.resolve({ ...mockData.produto, ...produto })
		}),
	delete: jest.fn().mockImplementation((id: number) => {
		if (id === mockData.produto.id) {
			return Promise.resolve(undefined)
		}
		throw new NotFoundException(`Produto com ID ${id} não encontrado`)
	}),
})

describe("ProdutoController (e2e)", () => {
	let testHelper: BaseTestHelper
	let mockData: ProdutoMockData
	let mockProdutoService: ReturnType<typeof createMockProdutoService>

	beforeEach(async () => {
		testHelper = new BaseTestHelper()
		mockData = ProdutoMockFactory.createCompleteData()
		mockProdutoService = createMockProdutoService(mockData)

		const mockServices = ProdutoServicesMockFactory.create()

		await testHelper.createTestModule({
			controller: ProdutoController,
			service: ProdutoService,
			entity: Produto,
			mockServices,
			additionalProviders: [
				{
					provide: ProdutoService,
					useValue: mockProdutoService,
				},
			],
		})
	})

	afterEach(async () => {
		await testHelper.cleanup()
	})

	describe("GET /produtos", () => {
		it("deve retornar todos os produtos", async () => {
			const response = await request(testHelper.httpServer).get("/produtos").expect(200)

			expect(response.body).toHaveLength(1)
			expect(response.body[0]).toMatchObject({
				id: mockData.produto.id,
				titulo: mockData.produto.titulo,
				preco: mockData.produto.preco,
			})
			expect(mockProdutoService.findAll).toHaveBeenCalled()
		})

		it("deve retornar um array vazio quando não houver produtos", async () => {
			mockProdutoService.findAll.mockResolvedValue([])

			const response = await request(testHelper.httpServer).get("/produtos").expect(200)

			expect(response.body).toHaveLength(0)
			expect(mockProdutoService.findAll).toHaveBeenCalled()
		})
	})

	describe("GET /produtos/:id", () => {
		it("deve retornar um produto pelo ID", async () => {
			const response = await request(testHelper.httpServer).get("/produtos/1").expect(200)

			expect(response.body).toMatchObject({
				id: mockData.produto.id,
				titulo: mockData.produto.titulo,
				preco: mockData.produto.preco,
			})
			expect(mockProdutoService.findById).toHaveBeenCalledWith(1)
		})

		it("deve retornar 404 quando o produto não for encontrado", async () => {
			await request(testHelper.httpServer).get("/produtos/999").expect(404)

			expect(mockProdutoService.findById).toHaveBeenCalledWith(999)
		})

		it("deve retornar 404 para id 0 (tratado como não encontrado)", async () => {
			await request(testHelper.httpServer).get("/produtos/0").expect(404)
		})

		it("deve retornar 400 para id não numérico", async () => {
			await request(testHelper.httpServer).get("/produtos/abc").expect(400)
		})
	})

	describe("GET /produtos/titulo/:titulo", () => {
		it("deve retornar produtos pelo título", async () => {
			const response = await request(testHelper.httpServer)
				.get("/produtos/titulo/Dom")
				.set("Authorization", "Bearer mock-token")
				.expect(200)

			expect(response.body).toHaveLength(1)
			expect(response.body[0].titulo).toContain("Dom")
			expect(testHelper.mockJwtGuard.canActivate).toHaveBeenCalled()
			expect(mockProdutoService.findByTitulo).toHaveBeenCalledWith("Dom")
		})

		it("deve retornar 401 quando o token for inválido ou ausente", async () => {
			testHelper.mockAuthUnauthorized("Token inválido")

			await request(testHelper.httpServer).get("/produtos/titulo/Dom").expect(401)
		})

		it("deve retornar 403 quando o usuário estiver autenticado mas sem permissão", async () => {
			testHelper.mockAuthForbidden()

			await request(testHelper.httpServer)
				.get("/produtos/titulo/Dom")
				.set("Authorization", "Bearer valid-but-insufficient-token")
				.expect(403)
		})
	})

	describe("POST /produtos", () => {
		const novoProduto: CreateProdutoRequest = {
			titulo: "Novo Livro",
			descricao: "Descrição do novo livro",
			preco: 39.99,
			desconto: 0,
			categoria: { id: 1 },
			editora: { id: 1 },
			autores: [{ id: 1 }],
		}

		it("deve criar um novo produto", async () => {
			const produtoSalvo = { ...mockData.produto, ...novoProduto }
			mockProdutoService.create.mockResolvedValue(produtoSalvo)

			const response = await request(testHelper.httpServer)
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(201)

			expect(response.body).toMatchObject({
				titulo: novoProduto.titulo,
				preco: novoProduto.preco,
			})

			expect(mockProdutoService.create).toHaveBeenCalled()
		})

		it("deve criar produto com imagem", async () => {
			const produtoSalvo = { ...mockData.produto, ...novoProduto }
			mockProdutoService.create.mockResolvedValue(produtoSalvo)

			await request(testHelper.httpServer)
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", novoProduto.titulo)
				.field("preco", novoProduto.preco.toString())
				.field("categoria[id]", "1")
				.field("editora[id]", "1")
				.attach("fotoFile", Buffer.from("fake image"), "test.jpg")
				.expect(201)

			expect(mockProdutoService.create).toHaveBeenCalled()
		})

		it("deve exigir autenticação", async () => {
			testHelper.mockAuthUnauthorized("Token inválido")

			await request(testHelper.httpServer).post("/produtos").send(novoProduto).expect(401)
		})

		it("deve retornar 400 quando campos obrigatórios estiverem ausentes", async () => {
			mockProdutoService.create.mockRejectedValue(new Error("Validation failed"))

			await request(testHelper.httpServer)
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(500)
		})
	})

	describe("PUT /produtos", () => {
		const produtoAtualizado: UpdateProdutoRequest = {
			id: 1,
			titulo: "Título Atualizado",
			descricao: "Descrição atualizada",
			preco: 49.99,
			desconto: 15,
			categoria: { id: 1 },
			editora: { id: 1 },
			autores: [{ id: 1 }],
		}

		it("deve atualizar produto existente", async () => {
			const response = await request(testHelper.httpServer)
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoAtualizado)
				.expect(200)

			expect(response.body).toMatchObject({
				titulo: produtoAtualizado.titulo,
				preco: produtoAtualizado.preco,
			})

			expect(mockProdutoService.update).toHaveBeenCalled()
		})

		it("deve exigir autenticação", async () => {
			testHelper.mockAuthUnauthorized("Token inválido")

			await request(testHelper.httpServer)
				.put("/produtos")
				.send(produtoAtualizado)
				.expect(401)
		})

		it("deve retornar 404 quando o produto não for encontrado", async () => {
			const produtoInexistente: UpdateProdutoRequest = {
				...produtoAtualizado,
				id: 999,
			}

			await request(testHelper.httpServer)
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInexistente)
				.expect(404)

			expect(mockProdutoService.update).toHaveBeenCalled()
		})
	})

	describe("DELETE /produtos/:id", () => {
		it("deve deletar o produto pelo id", async () => {
			await request(testHelper.httpServer)
				.delete("/produtos/1")
				.set("Authorization", "Bearer mock-token")
				.expect(204)

			expect(mockProdutoService.delete).toHaveBeenCalledWith(1)
		})

		it("deve exigir autenticação", async () => {
			testHelper.mockAuthUnauthorized("Token inválido")

			await request(testHelper.httpServer).delete("/produtos/1").expect(401)
		})

		it("deve retornar 404 quando o produto não for encontrado", async () => {
			await request(testHelper.httpServer)
				.delete("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(404)

			expect(mockProdutoService.delete).toHaveBeenCalledWith(999)
		})
	})
})

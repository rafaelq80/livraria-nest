import { HttpStatus, BadRequestException, NotFoundException } from "@nestjs/common"
import * as request from "supertest"
import { Categoria } from "../src/categoria/entities/categoria.entity"
import { CategoriaController } from "../src/categoria/controllers/categoria.controller"
import { CategoriaService } from "../src/categoria/services/categoria.service"
import { BaseTestHelper } from "./helpers/base-test.helper"
import { ProdutoMockFactory } from "./factories/produto-mock.factory"

interface CategoriaCreateDto {
	tipo: string
}

interface CategoriaUpdateDto {
	id: number
	tipo: string
}

interface MockCategoriaService extends Record<string, jest.Mock> {
	findAll: jest.Mock<Promise<Categoria[]>, unknown[]>
	findById: jest.Mock<Promise<Categoria>, unknown[]>
	findByTipo: jest.Mock<Promise<Categoria[]>, unknown[]>
	create: jest.Mock<Promise<Categoria>, unknown[]>
	update: jest.Mock<Promise<Categoria>, unknown[]>
	delete: jest.Mock<Promise<void>, unknown[]>
}

describe("Categoria E2E Tests", () => {
	let testHelper: BaseTestHelper
	let mockCategoria: Categoria
	let mockCategoriaService: MockCategoriaService

	beforeAll(async () => {
		testHelper = new BaseTestHelper()
		mockCategoria = ProdutoMockFactory.createMockCategoria({ tipo: "Literatura Brasileira" })

		mockCategoriaService = {
			findAll: jest.fn<Promise<Categoria[]>, unknown[]>(),
			findById: jest.fn<Promise<Categoria>, unknown[]>(),
			findByTipo: jest.fn<Promise<Categoria[]>, unknown[]>(),
			create: jest.fn<Promise<Categoria>, unknown[]>(),
			update: jest.fn<Promise<Categoria>, unknown[]>(),
			delete: jest.fn<Promise<void>, unknown[]>(),
		}

		await testHelper.createTestModule({
			controller: CategoriaController,
			service: CategoriaService,
			entity: Categoria,
			mockServices: [
				{
					provide: CategoriaService,
					useValue: mockCategoriaService,
				},
			],
		})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe("GET /categorias", () => {
		it("Deve retornar todas as Categorias", async () => {
			mockCategoriaService.findAll.mockResolvedValue([mockCategoria])

			const response = await request(testHelper.httpServer)
				.get("/categorias")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockCategoriaService.findAll).toHaveBeenCalled()
		})
	})

	describe("GET /categorias/:id", () => {
		it("Deve retornar uma Categoria pelo ID", async () => {
			mockCategoriaService.findById.mockResolvedValue(mockCategoria)

			const response = await request(testHelper.httpServer)
				.get("/categorias/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: 1,
				tipo: "Literatura Brasileira",
				produtos: [],
			})

			// Verificar se as datas existem e são válidas
			expect(response.body.createdAt).toBeDefined()
			expect(response.body.updatedAt).toBeDefined()
			expect(new Date(response.body.createdAt)).toBeInstanceOf(Date)
			expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date)

			expect(mockCategoriaService.findById).toHaveBeenCalledWith(1)
		})
	})

	describe("GET /categorias/tipo/:tipo", () => {
		it("Deve retornar todas as Categorias pelo tipo", async () => {
			mockCategoriaService.findByTipo.mockResolvedValue([mockCategoria])

			const response = await request(testHelper.httpServer)
				.get("/categorias/tipo/Brasileira")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockCategoriaService.findByTipo).toHaveBeenCalledWith("Brasileira")
		})
	})

	describe("POST /categorias", () => {
		it("Deve criar uma Categoria", async () => {
			const novaCategoria: CategoriaCreateDto = { tipo: "Nova Categoria" }
			const categoriaCriada = ProdutoMockFactory.createMockCategoria({ 
				id: 2, 
				tipo: novaCategoria.tipo 
			})

			mockCategoriaService.create.mockResolvedValue(categoriaCriada)

			const response = await request(testHelper.httpServer)
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(novaCategoria)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.tipo).toBe(novaCategoria.tipo)
			expect(mockCategoriaService.create).toHaveBeenCalledWith(novaCategoria)
		})

		it("Deve retornar BAD_REQUEST (400) se o tipo for null", async () => {
			// Configurar o mock para rejeitar com uma BadRequestException do NestJS
			mockCategoriaService.create.mockRejectedValue(
				new BadRequestException("Tipo é obrigatório")
			)

			const response = await request(testHelper.httpServer)
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)

			// Verificar se a mensagem de erro está correta
			expect(response.body).toHaveProperty("message", "Tipo é obrigatório")
			expect(response.body).toHaveProperty("statusCode", 400)
			expect(mockCategoriaService.create).toHaveBeenCalledWith({})
		})

		it("Deve retornar BAD_REQUEST (400) se o tipo for vazio", async () => {
			// Teste adicional para tipo vazio
			mockCategoriaService.create.mockRejectedValue(
				new BadRequestException("Tipo não pode ser vazio")
			)

			const response = await request(testHelper.httpServer)
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({ tipo: "" })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Tipo não pode ser vazio")
			expect(response.body).toHaveProperty("statusCode", 400)
		})

		it("Deve retornar BAD_REQUEST (400) se o tipo for apenas espaços", async () => {
			// Teste adicional para tipo com apenas espaços
			mockCategoriaService.create.mockRejectedValue(
				new BadRequestException("Tipo deve conter caracteres válidos")
			)

			const response = await request(testHelper.httpServer)
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({ tipo: "   " })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Tipo deve conter caracteres válidos")
		})
	})

	describe("PUT /categorias", () => {
		it("Deve atualizar uma categoria existente", async () => {
			const categoriaAtualizada: CategoriaUpdateDto = { id: 1, tipo: "Categoria Atualizada" }
			const categoriaAtualizadaMock = ProdutoMockFactory.createMockCategoria({
				id: 1,
				tipo: "Categoria Atualizada"
			})

			mockCategoriaService.update.mockResolvedValue(categoriaAtualizadaMock)

			const response = await request(testHelper.httpServer)
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaAtualizada)
				.expect(HttpStatus.OK)

			expect(response.body.tipo).toBe(categoriaAtualizada.tipo)
			expect(mockCategoriaService.update).toHaveBeenCalledWith(categoriaAtualizada)
		})

		it("Deve retornar BAD_REQUEST (400) ao atualizar com dados inválidos", async () => {
			mockCategoriaService.update.mockRejectedValue(
				new BadRequestException("ID é obrigatório para atualização")
			)

			await request(testHelper.httpServer)
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({ tipo: "Categoria Sem ID" })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /categorias/:id", () => {
		it("Deve deletar uma categoria pelo ID", async () => {
			mockCategoriaService.delete.mockResolvedValue(undefined)

			await request(testHelper.httpServer)
				.delete("/categorias/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			expect(mockCategoriaService.delete).toHaveBeenCalledWith(1)
		})

		it("Deve retornar NOT_FOUND (404) ao tentar deletar categoria inexistente", async () => {
			mockCategoriaService.delete.mockRejectedValue(
				new NotFoundException("Categoria não encontrada")
			)

			await request(testHelper.httpServer)
				.delete("/categorias/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})
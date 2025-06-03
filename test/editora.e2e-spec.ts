import { HttpStatus, BadRequestException, NotFoundException } from "@nestjs/common"
import * as request from "supertest"
import { Editora } from "../src/editora/entities/editora.entity"
import { EditoraController } from "../src/editora/controllers/editora.controller"
import { EditoraService } from "../src/editora/services/editora.service"
import { BaseTestHelper } from "./helpers/base-test.helper"
import { ProdutoMockFactory } from "./factories/produto-mock.factory"

interface EditoraCreateDto {
	nome: string
}

interface EditoraUpdateDto {
	id: number
	nome: string
}

interface MockEditoraService extends Record<string, jest.Mock> {
	findAll: jest.Mock<Promise<Editora[]>, unknown[]>
	findById: jest.Mock<Promise<Editora>, unknown[]>
	findByNome: jest.Mock<Promise<Editora[]>, unknown[]>
	create: jest.Mock<Promise<Editora>, unknown[]>
	update: jest.Mock<Promise<Editora>, unknown[]>
	delete: jest.Mock<Promise<void>, unknown[]>
}

describe("Editora E2E Tests", () => {
	let testHelper: BaseTestHelper
	let mockEditora: Editora
	let mockEditoraService: MockEditoraService

	beforeAll(async () => {
		testHelper = new BaseTestHelper()
		mockEditora = ProdutoMockFactory.createMockEditora({ nome: "Editora Globo" })

		mockEditoraService = {
			findAll: jest.fn<Promise<Editora[]>, unknown[]>(),
			findById: jest.fn<Promise<Editora>, unknown[]>(),
			findByNome: jest.fn<Promise<Editora[]>, unknown[]>(),
			create: jest.fn<Promise<Editora>, unknown[]>(),
			update: jest.fn<Promise<Editora>, unknown[]>(),
			delete: jest.fn<Promise<void>, unknown[]>(),
		}

		await testHelper.createTestModule({
			controller: EditoraController,
			service: EditoraService,
			entity: Editora,
			mockServices: [
				{
					provide: EditoraService,
					useValue: mockEditoraService,
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

	describe("GET /editoras", () => {
		it("Deve retornar todas as Editoras", async () => {
			mockEditoraService.findAll.mockResolvedValue([mockEditora])

			const response = await request(testHelper.httpServer)
				.get("/editoras")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockEditoraService.findAll).toHaveBeenCalled()
		})
	})

	describe("GET /editoras/:id", () => {
		it("Deve retornar uma Editora pelo ID", async () => {
			mockEditoraService.findById.mockResolvedValue(mockEditora)

			const response = await request(testHelper.httpServer)
				.get("/editoras/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: 1,
				nome: "Editora Globo",
				produtos: [],
			})

			// Verificar se as datas existem e são válidas
			expect(response.body.createdAt).toBeDefined()
			expect(response.body.updatedAt).toBeDefined()
			expect(new Date(response.body.createdAt)).toBeInstanceOf(Date)
			expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date)

			expect(mockEditoraService.findById).toHaveBeenCalledWith(1)
		})
	})

	describe("GET /editoras/nome/:nome", () => {
		it("Deve retornar todas as Editoras pelo nome", async () => {
			mockEditoraService.findByNome.mockResolvedValue([mockEditora])

			const response = await request(testHelper.httpServer)
				.get("/editoras/nome/Globo")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockEditoraService.findByNome).toHaveBeenCalledWith("Globo")
		})
	})

	describe("POST /editoras", () => {
		it("Deve criar uma Editora", async () => {
			const novaEditora: EditoraCreateDto = { nome: "Nova Editora" }
			const editoraCriada = ProdutoMockFactory.createMockEditora({ 
				id: 2, 
				nome: novaEditora.nome 
			})

			mockEditoraService.create.mockResolvedValue(editoraCriada)

			const response = await request(testHelper.httpServer)
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(novaEditora)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novaEditora.nome)
			expect(mockEditoraService.create).toHaveBeenCalledWith(novaEditora)
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for null", async () => {
			// Configurar o mock para rejeitar com uma BadRequestException do NestJS
			mockEditoraService.create.mockRejectedValue(
				new BadRequestException("Nome é obrigatório")
			)

			const response = await request(testHelper.httpServer)
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)

			// Verificar se a mensagem de erro está correta
			expect(response.body).toHaveProperty("message", "Nome é obrigatório")
			expect(response.body).toHaveProperty("statusCode", 400)
			expect(mockEditoraService.create).toHaveBeenCalledWith({})
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for vazio", async () => {
			// Teste adicional para nome vazio
			mockEditoraService.create.mockRejectedValue(
				new BadRequestException("Nome não pode ser vazio")
			)

			const response = await request(testHelper.httpServer)
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "" })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Nome não pode ser vazio")
			expect(response.body).toHaveProperty("statusCode", 400)
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for apenas espaços", async () => {
			// Teste adicional para nome com apenas espaços
			mockEditoraService.create.mockRejectedValue(
				new BadRequestException("Nome deve conter caracteres válidos")
			)

			const response = await request(testHelper.httpServer)
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "   " })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Nome deve conter caracteres válidos")
		})
	})

	describe("PUT /editoras", () => {
		it("Deve atualizar uma editora existente", async () => {
			const editoraAtualizada: EditoraUpdateDto = { id: 1, nome: "Editora Atualizada" }
			const editoraAtualizadaMock = ProdutoMockFactory.createMockEditora({
				id: 1,
				nome: "Editora Atualizada"
			})

			mockEditoraService.update.mockResolvedValue(editoraAtualizadaMock)

			const response = await request(testHelper.httpServer)
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraAtualizada)
				.expect(HttpStatus.OK)

			expect(response.body.nome).toBe(editoraAtualizada.nome)
			expect(mockEditoraService.update).toHaveBeenCalledWith(editoraAtualizada)
		})

		it("Deve retornar BAD_REQUEST (400) ao atualizar com dados inválidos", async () => {
			mockEditoraService.update.mockRejectedValue(
				new BadRequestException("ID é obrigatório para atualização")
			)

			await request(testHelper.httpServer)
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "Editora Sem ID" })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /editoras/:id", () => {
		it("Deve deletar uma editora pelo ID", async () => {
			mockEditoraService.delete.mockResolvedValue(undefined)

			await request(testHelper.httpServer)
				.delete("/editoras/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			expect(mockEditoraService.delete).toHaveBeenCalledWith(1)
		})

		it("Deve retornar NOT_FOUND (404) ao tentar deletar editora inexistente", async () => {
			mockEditoraService.delete.mockRejectedValue(
				new NotFoundException("Editora não encontrada")
			)

			await request(testHelper.httpServer)
				.delete("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})
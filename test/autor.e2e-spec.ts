import { BadRequestException, HttpStatus, NotFoundException } from "@nestjs/common"
import * as request from "supertest"
import { AutorController } from "../src/autor/controllers/autor.controller"
import { Autor } from "../src/autor/entities/autor.entity"
import { AutorService } from "../src/autor/services/autor.service"
import { ProdutoMockFactory } from "./factories/produto-mock.factory"
import { BaseTestHelper } from "./helpers/base-test.helper"

interface AutorCreateDto {
	nome: string
}

interface AutorUpdateDto {
	id: number
	nome: string
}

interface MockAutorService extends Record<string, jest.Mock> {
	findAll: jest.Mock<Promise<Autor[]>, unknown[]>
	findById: jest.Mock<Promise<Autor>, unknown[]>
	findByNome: jest.Mock<Promise<Autor[]>, unknown[]>
	create: jest.Mock<Promise<Autor>, unknown[]>
	update: jest.Mock<Promise<Autor>, unknown[]>
	delete: jest.Mock<Promise<void>, unknown[]>
}

describe("Autor E2E Tests", () => {
	let testHelper: BaseTestHelper
	let mockAutor: Autor
	let mockAutorService: MockAutorService

	beforeAll(async () => {
		testHelper = new BaseTestHelper()
		mockAutor = ProdutoMockFactory.createMockAutor({ nome: "Ziraldo" })

		mockAutorService = {
			findAll: jest.fn<Promise<Autor[]>, unknown[]>(),
			findById: jest.fn<Promise<Autor>, unknown[]>(),
			findByNome: jest.fn<Promise<Autor[]>, unknown[]>(),
			create: jest.fn<Promise<Autor>, unknown[]>(),
			update: jest.fn<Promise<Autor>, unknown[]>(),
			delete: jest.fn<Promise<void>, unknown[]>(),
		}

		await testHelper.createTestModule({
			controller: AutorController,
			service: AutorService,
			entity: Autor,
			mockServices: [
				{
					provide: AutorService,
					useValue: mockAutorService,
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

	describe("GET /autores", () => {
		it("Deve retornar todos os Autores", async () => {
			mockAutorService.findAll.mockResolvedValue([mockAutor])

			const response = await request(testHelper.httpServer)
				.get("/autores")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockAutorService.findAll).toHaveBeenCalled()
		})
	})

	describe("GET /autores/:id", () => {
		it("Deve retornar um Autor pelo ID", async () => {
			mockAutorService.findById.mockResolvedValue(mockAutor)

			const response = await request(testHelper.httpServer)
				.get("/autores/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: 1,
				nome: "Ziraldo",
				nacionalidade: "Brasileira",
				produtos: [],
			})

			expect(response.body.createdAt).toBeDefined()
			expect(response.body.updatedAt).toBeDefined()
			expect(new Date(response.body.createdAt)).toBeInstanceOf(Date)
			expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date)

			expect(mockAutorService.findById).toHaveBeenCalledWith(1)
		})
	})

	describe("GET /autores/nome/:nome", () => {
		it("Deve retornar todos os Autores pelo nome", async () => {
			mockAutorService.findByNome.mockResolvedValue([mockAutor])

			const response = await request(testHelper.httpServer)
				.get("/autores/nome/Ziraldo")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(mockAutorService.findByNome).toHaveBeenCalledWith("Ziraldo")
		})
	})

	describe("POST /autores", () => {
		it("Deve criar um Autor", async () => {
			const novoAutor: AutorCreateDto = { nome: "Novo Autor" }
			const autorCriado = ProdutoMockFactory.createMockAutor({
				id: 2,
				nome: novoAutor.nome,
			})

			mockAutorService.create.mockResolvedValue(autorCriado)

			const response = await request(testHelper.httpServer)
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novoAutor.nome)
			expect(mockAutorService.create).toHaveBeenCalledWith(novoAutor)
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for null", async () => {
			mockAutorService.create.mockRejectedValue(new BadRequestException("Nome é obrigatório"))

			const response = await request(testHelper.httpServer)
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Nome é obrigatório")
			expect(response.body).toHaveProperty("statusCode", 400)
			expect(mockAutorService.create).toHaveBeenCalledWith({})
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for vazio", async () => {
			mockAutorService.create.mockRejectedValue(
				new BadRequestException("Nome não pode ser vazio"),
			)

			const response = await request(testHelper.httpServer)
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "" })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Nome não pode ser vazio")
			expect(response.body).toHaveProperty("statusCode", 400)
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for apenas espaços", async () => {
			mockAutorService.create.mockRejectedValue(
				new BadRequestException("Nome deve conter caracteres válidos"),
			)

			const response = await request(testHelper.httpServer)
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "   " })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body).toHaveProperty("message", "Nome deve conter caracteres válidos")
		})
	})

	describe("PUT /autores", () => {
		it("Deve atualizar um autor existente", async () => {
			const autorAtualizado: AutorUpdateDto = { id: 1, nome: "Autor Atualizado" }
			const autorAtualizadoMock = ProdutoMockFactory.createMockAutor({
				id: 1,
				nome: "Autor Atualizado",
			})

			mockAutorService.update.mockResolvedValue(autorAtualizadoMock)

			const response = await request(testHelper.httpServer)
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorAtualizado)
				.expect(HttpStatus.OK)

			expect(response.body.nome).toBe(autorAtualizado.nome)
			expect(mockAutorService.update).toHaveBeenCalledWith(autorAtualizado)
		})

		it("Deve retornar BAD_REQUEST (400) ao atualizar com dados inválidos", async () => {
			mockAutorService.update.mockRejectedValue(
				new BadRequestException("ID é obrigatório para atualização"),
			)

			await request(testHelper.httpServer)
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "Autor Sem ID" })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /autores/:id", () => {
		it("Deve deletar um autor pelo ID", async () => {
			mockAutorService.delete.mockResolvedValue(undefined)

			await request(testHelper.httpServer)
				.delete("/autores/1")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			expect(mockAutorService.delete).toHaveBeenCalledWith(1)
		})

		it("Deve retornar NOT_FOUND (404) ao tentar deletar autor inexistente", async () => {
			mockAutorService.delete.mockRejectedValue(new NotFoundException("Autor não encontrado"))

			await request(testHelper.httpServer)
				.delete("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

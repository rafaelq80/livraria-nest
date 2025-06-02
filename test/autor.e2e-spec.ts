import { HttpStatus } from "@nestjs/common"
import * as request from "supertest"
import { Autor } from "../src/autor/entities/autor.entity"
import { EntityMocks } from "./helpers/entity-mocks.helper"
import { RepositoryMocks } from "./helpers/repository-mocks.helper"
import { E2ETestSetup } from "./helpers/test-setup.helper"

interface AutorCreateDto {
	nome: string
}

interface AutorUpdateDto {
	id: number
	nome: string
}

describe("Autor E2E Tests", () => {
	let testSetup: E2ETestSetup
	let autorRepositoryMock: ReturnType<typeof RepositoryMocks.createAutorRepositoryMock>

	beforeAll(async () => {
		testSetup = new E2ETestSetup()
		autorRepositoryMock = RepositoryMocks.createAutorRepositoryMock()

		await testSetup.setupTestModule({
			entities: [Autor],
			repositoryMocks: {
				Autor: autorRepositoryMock,
			},
		})
	})

	afterAll(async () => {
		await testSetup.closeApp()
	})

	afterEach(() => {
		E2ETestSetup.clearAllMocks()
	})

	describe("GET /autores", () => {
		it("Deve retornar todos os Autores", async () => {
			const response = await request(testSetup.getApp().getHttpServer())
				.get("/autores")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(autorRepositoryMock.find).toHaveBeenCalled()
		})
	})

	describe("GET /autores/:id", () => {
		it("Deve retornar um Autor pelo ID", async () => {
			EntityMocks.createAutorMock()

			const response = await request(testSetup.getApp().getHttpServer())
				.get("/autores/1")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: 1,
				nome: "Ziraldo",
				nacionalidade: "Brasileira",
				produtos: [],
			})

			// Verificar se as datas existem e são válidas
			expect(response.body.createdAt).toBeDefined()
			expect(response.body.updatedAt).toBeDefined()
			expect(new Date(response.body.createdAt)).toBeInstanceOf(Date)
			expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date)

			expect(autorRepositoryMock.findOne).toHaveBeenCalled()
		})
	})

	describe("GET /autores/nome/:nome", () => {
		it("Deve retornar todos os Autores pelo nome", async () => {
			const response = await request(testSetup.getApp().getHttpServer())
				.get("/autores/nome/Ziraldo")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.expect(HttpStatus.OK)

			expect(response.body).toHaveLength(1)
			expect(autorRepositoryMock.find).toHaveBeenCalled()
		})
	})

	describe("POST /autores", () => {
		it("Deve criar um Autor", async () => {
			const novaAutor: AutorCreateDto = { nome: "Novo Autor" }

			const response = await request(testSetup.getApp().getHttpServer())
				.post("/autores")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.send(novaAutor)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novaAutor.nome)
			expect(autorRepositoryMock.save).toHaveBeenCalled()
		})

		it("Deve retornar BAD_REQUEST (400) se o nome for null", async () => {
			await request(testSetup.getApp().getHttpServer())
				.post("/autores")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.send({})
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /autores", () => {
		it("Deve atualizar um autor existente", async () => {
			const autorAtualizada: AutorUpdateDto = { id: 1, nome: "Autor Atualizado" }
			const autorMock = EntityMocks.createAutorMock()

			autorRepositoryMock.findOne.mockResolvedValueOnce(autorMock)

			const response = await request(testSetup.getApp().getHttpServer())
				.put("/autores")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.send(autorAtualizada)
				.expect(HttpStatus.OK)

			expect(response.body.nome).toBe(autorAtualizada.nome)
			expect(autorRepositoryMock.save).toHaveBeenCalled()
		})
	})

	describe("DELETE /autores/:id", () => {
		it("Deve deletar um autor pelo ID", async () => {
			const autorMock = EntityMocks.createAutorMock()
			autorRepositoryMock.findOne.mockResolvedValueOnce(autorMock)

			await request(testSetup.getApp().getHttpServer())
				.delete("/autores/1")
				.set("Authorization", `Bearer ${testSetup.getToken()}`)
				.expect(HttpStatus.NO_CONTENT)

			expect(autorRepositoryMock.delete).toHaveBeenCalledWith(1)
		})
	})
})

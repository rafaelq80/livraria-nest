import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AutorModule } from "../src/autor/autor.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"

interface AutorCreateDto {
	nome: string
}

interface AutorUpdateDto {
	id: number
	nome: string
}

describe("Autor E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule([AutorModule])
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /autores", () => {
		it("Deve retornar todos os Autores", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
		})
	})

	describe("GET /autores/:id", () => {
		it("deve retornar autor quando ID existir", async () => {
			
			const novoAutor: AutorCreateDto = {
				nome: "Arlindo"
			}

			const createResponse = await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get(`/autores/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				nome: novoAutor.nome
			})
		})

		it("deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /autores/nome/:nome", () => {
		it("deve retornar lista de autores quando nome existir", async () => {
			const novoAutor: AutorCreateDto = {
				nome: "Zezinho"
			}

			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get(`/autores/nome/${novoAutor.nome}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
			expect(response.body[0]).toMatchObject({
				nome: novoAutor.nome
			})
		})

		it("deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})


	describe("POST /autores", () => {
		it("Deve criar um novo Autor", async () => {
			const novoAutor: AutorCreateDto = {
				nome: "Ziraldo"
			}

			const response = await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novoAutor.nome)
		})

		it("Deve retornar erro ao criar Autor sem nome", async () => {
			const autorInvalido = {}

			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /autores", () => {
		it("Deve atualizar um Autor existente", async () => {
			// Primeiro cria um autor
			const novoAutor: AutorCreateDto = {
				nome: "Ziraldo"
			}

			const createResponse = await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			const autorId = createResponse.body.id

			// Depois atualiza
			const autorAtualizado: AutorUpdateDto = {
				id: autorId,
				nome: "Ziraldo Alves Pinto"
			}

			const response = await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorAtualizado)
				.expect(HttpStatus.OK)

			expect(response.body.nome).toBe(autorAtualizado.nome)
		})

		it("Deve retornar erro ao atualizar Autor inexistente", async () => {
			const autorInexistente: AutorUpdateDto = {
				id: 999,
				nome: "Autor Inexistente"
			}

			await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorInexistente)
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("DELETE /autores/:id", () => {
		it("Deve deletar um Autor existente", async () => {
			// Primeiro cria um autor
			const novoAutor: AutorCreateDto = {
				nome: "Ziraldo"
			}

			const createResponse = await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(novoAutor)
				.expect(HttpStatus.CREATED)

			const autorId = createResponse.body.id

			// Depois deleta
			await request(app.getHttpServer())
				.delete(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			// Verifica se foi realmente deletado
			await request(app.getHttpServer())
				.get(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Deve retornar erro ao deletar Autor inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

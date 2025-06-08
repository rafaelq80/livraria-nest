import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { EditoraModule } from "../src/editora/editora.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"

interface EditoraCreateDto {
	nome: string
}

interface EditoraUpdateDto {
	id: number
	nome: string
}

describe("Editora E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule([EditoraModule])
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /editoras", () => {
		it("Deve retornar todas as Editoras", async () => {
			const response = await request(app.getHttpServer())
				.get("/editoras")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
		})
	})

	describe("POST /editoras", () => {
		it("Deve criar uma nova Editora", async () => {
			const novaEditora: EditoraCreateDto = {
				nome: "Editora Globo"
			}

			const response = await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(novaEditora)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novaEditora.nome)
		})

		it("Deve retornar erro ao criar Editora sem nome", async () => {
			const editoraInvalida = {}

			await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraInvalida)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /editoras", () => {
		it("Deve atualizar uma Editora existente", async () => {
			// Primeiro cria uma editora
			const novaEditora: EditoraCreateDto = {
				nome: "Editora Bookman"
			}

			const createResponse = await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(novaEditora)
				.expect(HttpStatus.CREATED)

			const editoraId = createResponse.body.id

			// Depois atualiza
			const editoraAtualizada: EditoraUpdateDto = {
				id: editoraId,
				nome: "Editora Bookman International"
			}

			const response = await request(app.getHttpServer())
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraAtualizada)
				.expect(HttpStatus.OK)

			expect(response.body.nome).toBe(editoraAtualizada.nome)
		})

		it("Deve retornar erro ao atualizar Editora inexistente", async () => {
			const editoraInexistente: EditoraUpdateDto = {
				id: 999,
				nome: "Editora Inexistente"
			}

			await request(app.getHttpServer())
				.put("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.send(editoraInexistente)
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("DELETE /editoras/:id", () => {
		it("Deve deletar uma Editora existente", async () => {
			// Primeiro cria uma editora
			const novaEditora: EditoraCreateDto = {
				nome: "Editora Paulus"
			}

			const createResponse = await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(novaEditora)
				.expect(HttpStatus.CREATED)

			const editoraId = createResponse.body.id

			// Depois deleta
			await request(app.getHttpServer())
				.delete(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			// Verifica se foi realmente deletada
			await request(app.getHttpServer())
				.get(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Deve retornar erro ao deletar Editora inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

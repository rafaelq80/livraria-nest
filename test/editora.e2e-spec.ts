import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { EditoraModule } from "../src/editora/editora.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"
import { criarEditoraPayload, criarEditoraNoBanco } from './helpers/payloads'

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

	describe("GET /editoras/:id", () => {
		it("deve retornar editora quando ID existir", async () => {
			const novoEditora = criarEditoraPayload({ nome: "Sextante" });
			const createResponse = await criarEditoraNoBanco(app, novoEditora);

			const response = await request(app.getHttpServer())
				.get(`/editoras/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				nome: novoEditora.nome
			})
		})

		it("deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /editoras/nome/:nome", () => {
		it("deve retornar lista de editoras quando nome existir", async () => {
			const novoEditora = criarEditoraPayload({ nome: "Melhoramentos" });
			await criarEditoraNoBanco(app, novoEditora);

			const response = await request(app.getHttpServer())
				.get(`/editoras/nome/${novoEditora.nome}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
			expect(response.body[0]).toMatchObject({
				nome: novoEditora.nome
			})
		})

		it("deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/editoras/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})

	describe("POST /editoras", () => {
		it("Deve criar uma nova Editora", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Globo" });
			const response = await criarEditoraNoBanco(app, novaEditora);

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
			const novaEditora = criarEditoraPayload({ nome: "Editora Bookman" });
			const createResponse = await criarEditoraNoBanco(app, novaEditora);

			const editoraId = createResponse.body.id

			const editoraAtualizada = {
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
			const editoraInexistente = {
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
			const novaEditora = criarEditoraPayload({ nome: "Editora Paulus" });
			const createResponse = await criarEditoraNoBanco(app, novaEditora);

			const editoraId = createResponse.body.id

			await request(app.getHttpServer())
				.delete(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

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

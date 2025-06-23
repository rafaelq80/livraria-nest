import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { CategoriaModule } from "../src/categoria/categoria.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"
import { criarCategoriaPayload, criarCategoriaNoBanco } from './helpers/payloads'

describe("Categoria E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule([CategoriaModule])
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /categorias", () => {
		it("Deve retornar todas as Categorias", async () => {
			const response = await request(app.getHttpServer())
				.get("/categorias")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
		})
	})

	describe("GET /categorias/:id", () => {
		it("deve retornar categoria quando ID existir", async () => {
			const novoCategoria = criarCategoriaPayload({ tipo: "Matemática" });
			const createResponse = await criarCategoriaNoBanco(app, novoCategoria);

			const response = await request(app.getHttpServer())
				.get(`/categorias/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				tipo: novoCategoria.tipo
			})
		})

		it("deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/categorias/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /categorias/tipo/:tipo", () => {
		it("deve retornar lista de categorias quando tipo existir", async () => {
			const novoCategoria = criarCategoriaPayload({ tipo: "Economia" });
			await criarCategoriaNoBanco(app, novoCategoria);

			const response = await request(app.getHttpServer())
				.get(`/categorias/tipo/${novoCategoria.tipo}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
			expect(response.body[0]).toMatchObject({
				tipo: novoCategoria.tipo
			})
		})

		it("deve retornar lista vazia quando tipo não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/categorias/tipo/TipoInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})


	describe("POST /categorias", () => {
		it("Deve criar uma nova Categoria", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Literatura Brasileira" });
			const response = await criarCategoriaNoBanco(app, novaCategoria);

			expect(response.body).toHaveProperty("id")
			expect(response.body.tipo).toBe(novaCategoria.tipo)
		})

		it("Deve retornar erro ao criar Categoria sem tipo", async () => {
			const categoriaInvalida = {}

			await request(app.getHttpServer())
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaInvalida)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /categorias", () => {
		it("Deve atualizar uma Categoria existente", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Literatura Estrangeira" });
			const createResponse = await criarCategoriaNoBanco(app, novaCategoria);

			const categoriaId = createResponse.body.id

			const categoriaAtualizada = {
				id: categoriaId,
				tipo: "Literatura Brasileira Contemporânea"
			}

			const response = await request(app.getHttpServer())
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaAtualizada)
				.expect(HttpStatus.OK)

			expect(response.body.tipo).toBe(categoriaAtualizada.tipo)
		})

		it("Deve retornar erro ao atualizar Categoria inexistente", async () => {
			const categoriaInexistente = {
				id: 999,
				tipo: "Categoria Inexistente"
			}

			await request(app.getHttpServer())
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaInexistente)
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("DELETE /categorias/:id", () => {
		it("Deve deletar uma Categoria existente", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Literatura Infantil" });
			const createResponse = await criarCategoriaNoBanco(app, novaCategoria);

			const categoriaId = createResponse.body.id

			await request(app.getHttpServer())
				.delete(`/categorias/${categoriaId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			await request(app.getHttpServer())
				.get(`/categorias/${categoriaId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Deve retornar erro ao deletar Categoria inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/categorias/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

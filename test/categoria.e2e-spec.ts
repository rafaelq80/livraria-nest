import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { CategoriaModule } from "../src/categoria/categoria.module"
import { criarCategoriaNoBanco, criarCategoriaPayload, criarCategoriaUpdatePayload , TestDatabaseHelper } from './helpers'

describe("Categoria E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[CategoriaModule],
			{
				// Configurações específicas para testes de categoria
				jwt: {
					expiration: '1h',
				},
				app: {
					environment: 'test-categoria',
				}
			}
		)
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /categorias", () => {
		it("Teste 1: Deve retornar todas as Categorias", async () => {
			const response = await request(app.getHttpServer())
				.get("/categorias")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
		})
	})

	describe("GET /categorias/:id", () => {
		it("Teste 2: deve retornar categoria quando ID existir", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Ficção Científica" });
			const createResponse = await criarCategoriaNoBanco(app, novaCategoria);

			const response = await request(app.getHttpServer())
				.get(`/categorias/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toMatchObject({
				id: createResponse.id,
				tipo: novaCategoria.tipo
			})
		})

		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/categorias/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 4: deve retornar 400 quando ID for inválido", async () => {
			await request(app.getHttpServer())
				.get("/categorias/abc")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("GET /categorias/tipo/:tipo", () => {
		it("Teste 5: deve retornar lista de categorias quando tipo existir", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Romance Histórico" });
			await criarCategoriaNoBanco(app, novaCategoria);

			const response = await request(app.getHttpServer())
				.get(`/categorias/tipo/${novaCategoria.tipo}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data[0]).toMatchObject({
				tipo: novaCategoria.tipo
			})
		})

		it("Teste 6: deve retornar lista vazia quando tipo não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/categorias/tipo/TipoInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})

		it("Teste 7: deve fazer busca parcial", async () => {
			await criarCategoriaNoBanco(app, { tipo: "Ficção Científica" });

			const response = await request(app.getHttpServer())
				.get("/categorias/tipo/Ficção")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data.some(c => c.tipo.includes("Ficção"))).toBe(true)
		})
	})

	describe("POST /categorias", () => {
		it("Teste 8: Deve criar uma nova Categoria", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Biografia" });
			const response = await criarCategoriaNoBanco(app, novaCategoria);

			expect(response).toHaveProperty("id")
			expect(response.tipo).toBe(novaCategoria.tipo)
		})

		it("Teste 9: Deve retornar erro ao criar Categoria sem tipo", async () => {
			await request(app.getHttpServer())
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 10: Deve retornar erro ao criar Categoria com tipo muito curto", async () => {
			await request(app.getHttpServer())
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({ tipo: "A" })
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 11: Deve retornar erro ao criar Categoria com tipo duplicado", async () => {
			const tipoCategoria = "Categoria Duplicada";
			await criarCategoriaNoBanco(app, { tipo: tipoCategoria });

			await request(app.getHttpServer())
				.post("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send({ tipo: tipoCategoria })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /categorias", () => {
		it("Teste 12: Deve atualizar uma Categoria existente", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Aventura" });
			const createResponse = await criarCategoriaNoBanco(app, novaCategoria);
			
			const categoriaAtualizada = criarCategoriaUpdatePayload(createResponse.id, {
				tipo: "Aventura e Suspense"
			});

			const response = await request(app.getHttpServer())
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaAtualizada)
				.expect(HttpStatus.OK);

			expect(response.body.data.tipo).toBe(categoriaAtualizada.tipo);
		})

		it("Teste 13: Deve retornar erro ao atualizar Categoria inexistente", async () => {
			const categoriaInexistente = criarCategoriaUpdatePayload(999, {
				tipo: `Categoria Inexistente ${Date.now()}`
			});

			await request(app.getHttpServer())
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaInexistente)
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 14: Deve retornar erro ao atualizar Categoria com tipo duplicado", async () => {
			await criarCategoriaNoBanco(app, { tipo: "Primeira Categoria" });
			const categoria2 = await criarCategoriaNoBanco(app, { tipo: "Segunda Categoria" });

			const categoriaAtualizada = {
				id: categoria2.id,
				tipo: "Primeira Categoria" // Tipo que já existe
			};

			await request(app.getHttpServer())
				.put("/categorias")
				.set("Authorization", "Bearer mock-token")
				.send(categoriaAtualizada)
				.expect(HttpStatus.BAD_REQUEST);
		})
	})

	describe("DELETE /categorias/:id", () => {
		it("Teste 15: Deve deletar uma Categoria existente", async () => {
			const novaCategoria = criarCategoriaPayload({ tipo: "Categoria Para Deletar" });
			const createResponse = await criarCategoriaNoBanco(app, novaCategoria);
			const categoriaId = createResponse.id;

			// Verifica se a categoria existe antes de deletar
			const getResponse = await request(app.getHttpServer())
				.get(`/categorias/${categoriaId}`)
				.set("Authorization", "Bearer mock-token");
			if (getResponse.status !== 200) {
				throw new Error(`Categoria não existe antes do delete. Status: ${getResponse.status}`);
			}

			await request(app.getHttpServer())
				.delete(`/categorias/${categoriaId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.get(`/categorias/${categoriaId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 16: Deve retornar erro ao deletar Categoria inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/categorias/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

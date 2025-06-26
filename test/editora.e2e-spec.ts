import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { EditoraModule } from "../src/editora/editora.module"
import { criarEditoraNoBanco, criarEditoraPayload, criarEditoraUpdatePayload , TestDatabaseHelper } from './helpers'

describe("Editora E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[EditoraModule],
			{
				// Configurações específicas para testes de editora
				jwt: {
					expiration: '1h',
				},
				app: {
					environment: 'test-editora',
				}
			}
		)
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /editoras", () => {
		it("Teste 1: Deve retornar todas as Editoras", async () => {
			const response = await request(app.getHttpServer())
				.get("/editoras")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
		})
	})

	describe("GET /editoras/:id", () => {
		it("Teste 2: deve retornar editora quando ID existir", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Moderna" });
			const createResponse = await criarEditoraNoBanco(app, novaEditora);

			const response = await request(app.getHttpServer())
				.get(`/editoras/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toMatchObject({
				id: createResponse.id,
				nome: novaEditora.nome
			})
		})

		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 4: deve retornar 400 quando ID for inválido", async () => {
			await request(app.getHttpServer())
				.get("/editoras/abc")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("GET /editoras/nome/:nome", () => {
		it("Teste 5: deve retornar lista de editoras quando nome existir", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Nacional" });
			await criarEditoraNoBanco(app, novaEditora);

			const response = await request(app.getHttpServer())
				.get(`/editoras/nome/${novaEditora.nome}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data[0]).toMatchObject({
				nome: novaEditora.nome
			})
		})

		it("Teste 6: deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/editoras/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})

		it("Teste 7: deve fazer busca parcial", async () => {
			await criarEditoraNoBanco(app, { nome: "Editora Brasileira Ltda" });

			const response = await request(app.getHttpServer())
				.get("/editoras/nome/Brasileira")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data.some(e => e.nome.includes("Brasileira"))).toBe(true)
		})
	})

	describe("POST /editoras", () => {
		it("Teste 8: Deve criar uma nova Editora", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Nova" });
			const response = await criarEditoraNoBanco(app, novaEditora);

			expect(response).toHaveProperty("id")
			expect(response.nome).toBe(novaEditora.nome)
		})

		it("Teste 9: Deve retornar erro ao criar Editora sem nome", async () => {
			await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 10: Deve retornar erro ao criar Editora com nome muito curto", async () => {
			await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "A" })
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 11: Deve retornar erro ao criar Editora com nome duplicado", async () => {
			const nomeEditora = "Editora Duplicada";
			await criarEditoraNoBanco(app, { nome: nomeEditora });

			await request(app.getHttpServer())
				.post("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: nomeEditora })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /editoras", () => {
		it("Teste 12: Deve atualizar uma Editora existente", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Antiga" });
			const createResponse = await criarEditoraNoBanco(app, novaEditora);
			
			const editoraAtualizada = criarEditoraUpdatePayload(createResponse.id, {
				nome: "Editora Antiga Renovada"
			});

			const response = await request(app.getHttpServer())
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraAtualizada)
				.expect(HttpStatus.OK);

			expect(response.body.data.nome).toBe(editoraAtualizada.nome);
		})

		it("Teste 13: Deve retornar erro ao atualizar Editora inexistente", async () => {
			const editoraInexistente = criarEditoraUpdatePayload(999, {
				nome: `Editora Inexistente ${Date.now()}`
			});

			await request(app.getHttpServer())
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraInexistente)
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 14: Deve retornar erro ao atualizar Editora com nome duplicado", async () => {
			await criarEditoraNoBanco(app, { nome: "Primeira Editora" });
			const editora2 = await criarEditoraNoBanco(app, { nome: "Segunda Editora" });

			const editoraAtualizada = {
				id: editora2.id,
				nome: "Primeira Editora" // Nome que já existe
			};

			await request(app.getHttpServer())
				.put("/editoras")
				.set("Authorization", "Bearer mock-token")
				.send(editoraAtualizada)
				.expect(HttpStatus.BAD_REQUEST);
		})
	})

	describe("DELETE /editoras/:id", () => {
		it("Teste 15: Deve deletar uma Editora existente", async () => {
			const novaEditora = criarEditoraPayload({ nome: "Editora Para Deletar" });
			const createResponse = await criarEditoraNoBanco(app, novaEditora);
			const editoraId = createResponse.id;

			// Verifica se a editora existe antes de deletar
			const getResponse = await request(app.getHttpServer())
				.get(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token");
			if (getResponse.status !== 200) {
				throw new Error(`Editora não existe antes do delete. Status: ${getResponse.status}`);
			}

			await request(app.getHttpServer())
				.delete(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.get(`/editoras/${editoraId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 16: Deve retornar erro ao deletar Editora inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/editoras/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

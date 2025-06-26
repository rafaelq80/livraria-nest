import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { AutorModule } from "../src/autor/autor.module"
import { criarAutorNoBanco, criarAutorPayload, criarAutorUpdatePayload , TestDatabaseHelper } from './helpers'

describe("Autor E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[AutorModule],
			{
				// Configurações específicas para testes de autor
				jwt: {
					expiration: '1h',
				},
				app: {
					environment: 'test-autor',
				}
			}
		)
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /autores", () => {
		it("Teste 1: Deve retornar todos os Autores", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
		})
	})

	describe("GET /autores/:id", () => {
		it("Teste 2: deve retornar autor quando ID existir", async () => {
			const novoAutor = criarAutorPayload({ nome: "Arlindo Silva" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);

			const response = await request(app.getHttpServer())
				.get(`/autores/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toMatchObject({
				id: createResponse.id,
				nome: novoAutor.nome,
				nacionalidade: novoAutor.nacionalidade
			})
		})

		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 4: deve retornar 400 quando ID for inválido", async () => {
			await request(app.getHttpServer())
				.get("/autores/abc")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("GET /autores/nome/:nome", () => {
		it("Teste 5: deve retornar lista de autores quando nome existir", async () => {
			const novoAutor = criarAutorPayload({ nome: "Zezinho Santos" });
			await criarAutorNoBanco(app, novoAutor);

			const response = await request(app.getHttpServer())
				.get(`/autores/nome/${novoAutor.nome}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data[0]).toMatchObject({
				nome: novoAutor.nome
			})
		})

		it("Teste 6: deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})

		it("Teste 7: deve fazer busca parcial", async () => {
			await criarAutorNoBanco(app, { nome: "João Silva Santos" });

			const response = await request(app.getHttpServer())
				.get("/autores/nome/Silva")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data.some(a => a.nome.includes("Silva"))).toBe(true)
		})
	})

	describe("POST /autores", () => {
		it("Teste 8: Deve criar um novo Autor", async () => {
			const novoAutor = criarAutorPayload({ nome: "Ziraldo Alves" });
			const response = await criarAutorNoBanco(app, novoAutor);

			expect(response).toHaveProperty("id")
			expect(response.nome).toBe(novoAutor.nome)
			expect(response.nacionalidade).toBe(novoAutor.nacionalidade)
		})

		it("Teste 9: Deve retornar erro ao criar Autor sem nome", async () => {
			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 10: Deve retornar erro ao criar Autor com nome muito curto", async () => {
			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "A" })
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 11: Deve retornar erro ao criar Autor com nome duplicado", async () => {
			const nomeAutor = "Autor Duplicado";
			await criarAutorNoBanco(app, { nome: nomeAutor });

			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: nomeAutor })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /autores", () => {
		it("Teste 12: Deve atualizar um Autor existente", async () => {
			const novoAutor = criarAutorPayload({ nome: "Reinaldo Silva" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);
			
			const autorAtualizado = criarAutorUpdatePayload(createResponse.id, {
				nome: "Reinaldo Azevedo Silva",
				nacionalidade: "Brasileira"
			});

			const response = await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorAtualizado)
				.expect(HttpStatus.OK);

			expect(response.body.data.nome).toBe(autorAtualizado.nome);
			expect(response.body.data.nacionalidade).toBe(autorAtualizado.nacionalidade);
		})

		it("Teste 13: Deve retornar erro ao atualizar Autor inexistente", async () => {
			const autorInexistente = criarAutorUpdatePayload(999, {
				nome: `Autor Inexistente ${Date.now()}`
			});

			await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorInexistente)
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 14: Deve retornar erro ao atualizar Autor com nome duplicado", async () => {
			await criarAutorNoBanco(app, { nome: "Primeiro Autor" });
			const autor2 = await criarAutorNoBanco(app, { nome: "Segundo Autor" });

			const autorAtualizado = {
				id: autor2.id,
				nome: "Primeiro Autor" // Nome que já existe
			};

			await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorAtualizado)
				.expect(HttpStatus.BAD_REQUEST);
		})
	})

	describe("DELETE /autores/:id", () => {
		it("Teste 15: Deve deletar um Autor existente", async () => {
			const novoAutor = criarAutorPayload({ nome: "Autor Para Deletar" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);
			const autorId = createResponse.id;

			// Verifica se o autor existe antes de deletar
			const getResponse = await request(app.getHttpServer())
				.get(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token");
			if (getResponse.status !== 200) {
				throw new Error(`Autor não existe antes do delete. Status: ${getResponse.status}`);
			}

			await request(app.getHttpServer())
				.delete(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.get(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 16: Deve retornar erro ao deletar Autor inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

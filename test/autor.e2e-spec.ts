import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AutorModule } from "../src/autor/autor.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"
import { criarAutorPayload, criarAutorNoBanco, criarAutorUpdatePayload } from './helpers/payloads'

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
		it("Teste 1: Deve retornar todos os Autores", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
		})
	})

	describe("GET /autores/:id", () => {
		it("Teste 2: deve retornar autor quando ID existir", async () => {
			const novoAutor = criarAutorPayload({ nome: "Arlindo" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);

			const response = await request(app.getHttpServer())
				.get(`/autores/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				nome: novoAutor.nome
			})
		})

		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /autores/nome/:nome", () => {
		it("Teste 4: deve retornar lista de autores quando nome existir", async () => {
			const novoAutor = criarAutorPayload({ nome: "Zezinho" });
			await criarAutorNoBanco(app, novoAutor);

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

		it("Teste 5: deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/autores/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})


	describe("POST /autores", () => {
		it("Teste 6: Deve criar um novo Autor", async () => {
			const novoAutor = criarAutorPayload({ nome: "Ziraldo" });
			const response = await criarAutorNoBanco(app, novoAutor);

			expect(response.body).toHaveProperty("id")
			expect(response.body.nome).toBe(novoAutor.nome)
		})

		it("Teste 7: Deve retornar erro ao criar Autor sem nome", async () => {
			await request(app.getHttpServer())
				.post("/autores")
				.set("Authorization", "Bearer mock-token")
				.send({})
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /autores", () => {
		it("Teste 8: Deve atualizar um Autor existente", async () => {
			const novoAutor = criarAutorPayload({ nome: "Reinaldo" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);
			
			const autorAtualizado = criarAutorUpdatePayload(createResponse.body.id, {
				nome: "Reinaldo Azevedo",
				nacionalidade: "Brasileira"
			});

			const response = await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorAtualizado)
				.expect(HttpStatus.OK);

			expect(response.body.nome).toBe(autorAtualizado.nome);
		})

		it("Teste 9: Deve retornar erro ao atualizar Autor inexistente", async () => {
			const autorInexistente = criarAutorUpdatePayload(999, {
				nome: `Autor Inexistente ${Date.now()}`
			});

			await request(app.getHttpServer())
				.put("/autores")
				.set("Authorization", "Bearer mock-token")
				.send(autorInexistente)
				.expect(HttpStatus.NOT_FOUND);
		})
	})

	describe("DELETE /autores/:id", () => {
		it("Teste 10: Deve deletar um Autor existente", async () => {
			const novoAutor = criarAutorPayload({ nome: "Geraldo" });
			const createResponse = await criarAutorNoBanco(app, novoAutor);
			const autorId = createResponse.body.id;

			await request(app.getHttpServer())
				.delete(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			await request(app.getHttpServer())
				.get(`/autores/${autorId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 11: Deve retornar erro ao deletar Autor inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/autores/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

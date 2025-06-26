import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { RoleModule } from "../src/role/role.module"
import { criarRoleNoBanco, criarRolePayload, criarRoleUpdatePayload, TestDatabaseHelper } from './helpers'


describe("Role E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[RoleModule],
			{
				// Configurações específicas para testes de role
				jwt: {
					expiration: '1h',
				},
				app: {
					environment: 'test-role',
				}
			}
		)
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /roles", () => {
		it("Teste 1: Deve retornar todas as Roles", async () => {
			const response = await request(app.getHttpServer())
				.get("/roles")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
		})
	})

	describe("GET /roles/:id", () => {
		it("Teste 2: deve retornar role quando ID existir", async () => {
			const novaRole = criarRolePayload({ nome: "ROLE_MODERATOR", descricao: "Moderador do sistema" });
			const createResponse = await criarRoleNoBanco(app, novaRole);

			const response = await request(app.getHttpServer())
				.get(`/roles/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toMatchObject({
				id: createResponse.id,
				nome: novaRole.nome,
				descricao: novaRole.descricao
			})
		})

		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/roles/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 4: deve retornar 400 quando ID for inválido", async () => {
			await request(app.getHttpServer())
				.get("/roles/abc")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("GET /roles/nome/:nome", () => {
		it("Teste 5: deve retornar lista de roles quando nome existir", async () => {
			const novaRole = criarRolePayload({ nome: "ROLE_EDITOR", descricao: "Editor de conteúdo" });
			await criarRoleNoBanco(app, novaRole);

			const response = await request(app.getHttpServer())
				.get(`/roles/nome/${novaRole.nome}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data[0]).toMatchObject({
				nome: novaRole.nome
			})
		})

		it("Teste 6: deve retornar lista vazia quando nome não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/roles/nome/NomeInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})

		it("Teste 7: deve fazer busca parcial", async () => {
			await criarRoleNoBanco(app, { nome: "ROLE_ADMIN_SYSTEM", descricao: "Administrador do sistema" });

			const response = await request(app.getHttpServer())
				.get("/roles/nome/ADMIN")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data.some(r => r.nome.includes("ADMIN"))).toBe(true)
		})
	})

	describe("POST /roles", () => {
		it("Teste 8: Deve criar uma nova Role", async () => {
			const novaRole = criarRolePayload({ nome: "ROLE_VIEWER", descricao: "Visualizador de conteúdo" });
			const response = await criarRoleNoBanco(app, novaRole);

			expect(response).toHaveProperty("id")
			expect(response.nome).toBe(novaRole.nome)
			expect(response.descricao).toBe(novaRole.descricao)
		})

		it("Teste 9: Deve retornar erro ao criar Role sem nome", async () => {
			await request(app.getHttpServer())
				.post("/roles")
				.set("Authorization", "Bearer mock-token")
				.send({ descricao: "Descrição sem nome" })
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 10: Deve retornar erro ao criar Role com nome muito curto", async () => {
			await request(app.getHttpServer())
				.post("/roles")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "A", descricao: "Descrição" })
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 11: Deve retornar erro ao criar Role com nome duplicado", async () => {
			const nomeRole = "ROLE_DUPLICADA";
			await criarRoleNoBanco(app, { nome: nomeRole, descricao: "Primeira descrição" });

			await request(app.getHttpServer())
				.post("/roles")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: nomeRole, descricao: "Segunda descrição" })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /roles", () => {
		it("Teste 12: Deve atualizar uma Role existente", async () => {
			const novaRole = criarRolePayload({ nome: "ROLE_BASIC", descricao: "Usuário básico" });
			const createResponse = await criarRoleNoBanco(app, novaRole);
			
			const roleAtualizada = criarRoleUpdatePayload(createResponse.id, {
				nome: "ROLE_BASIC_PLUS",
				descricao: "Usuário básico com privilégios extras"
			});

			const response = await request(app.getHttpServer())
				.put("/roles")
				.set("Authorization", "Bearer mock-token")
				.send(roleAtualizada)
				.expect(HttpStatus.OK);

			expect(response.body.data.nome).toBe(roleAtualizada.nome);
			expect(response.body.data.descricao).toBe(roleAtualizada.descricao);
		})

		it("Teste 13: Deve retornar erro ao atualizar Role inexistente", async () => {
			const roleInexistente = criarRoleUpdatePayload(999, {
				nome: `ROLE_INEXISTENTE_${Date.now()}`,
				descricao: "Role que não existe"
			});

			await request(app.getHttpServer())
				.put("/roles")
				.set("Authorization", "Bearer mock-token")
				.send(roleInexistente)
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 14: Deve retornar erro ao atualizar Role com nome duplicado", async () => {
			await criarRoleNoBanco(app, { nome: "ROLE_PRIMEIRA", descricao: "Primeira role" });
			const role2 = await criarRoleNoBanco(app, { nome: "ROLE_SEGUNDA", descricao: "Segunda role" });

			const roleAtualizada = {
				id: role2.id,
				nome: "ROLE_PRIMEIRA", // Nome que já existe
				descricao: "Nova descrição"
			};

			await request(app.getHttpServer())
				.put("/roles")
				.set("Authorization", "Bearer mock-token")
				.send(roleAtualizada)
				.expect(HttpStatus.BAD_REQUEST);
		})
	})

	describe("DELETE /roles/:id", () => {
		it("Teste 15: Deve deletar uma Role existente", async () => {
			const novaRole = criarRolePayload({ nome: "ROLE_PARA_DELETAR", descricao: "Role para deletar" });
			const createResponse = await criarRoleNoBanco(app, novaRole);
			const roleId = createResponse.id;

			// Verifica se a role existe antes de deletar
			const getResponse = await request(app.getHttpServer())
				.get(`/roles/${roleId}`)
				.set("Authorization", "Bearer mock-token");
			if (getResponse.status !== 200) {
				throw new Error(`Role não existe antes do delete. Status: ${getResponse.status}`);
			}

			await request(app.getHttpServer())
				.delete(`/roles/${roleId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.get(`/roles/${roleId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND);
		})

		it("Teste 16: Deve retornar erro ao deletar Role inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/roles/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
}) 
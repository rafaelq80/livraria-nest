import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { UsuarioModule } from "../src/usuario/usuario.module"
import { RoleModule } from "../src/role/role.module"
import { criarRoleNoBanco, criarUsuarioNoBanco, criarUsuarioPayload, criarUsuarioUpdatePayload , TestDatabaseHelper } from './helpers'

describe("Usuario E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication
	let roleAdminId: number
	let roleUserId: number

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[UsuarioModule, RoleModule],
			{
				// Configurações específicas para testes de usuário
				jwt: {
					expiration: '1h',
				},
				auth: {
					maxLoginAttempts: 3,
				},
				app: {
					environment: 'test-usuario',
				}
			}
		)
		const roleAdmin = await criarRoleNoBanco(app, { nome: 'admin', descricao: 'Administrador do sistema' });
		const roleUser = await criarRoleNoBanco(app, { nome: 'user', descricao: 'Usuário padrão' });
		roleAdminId = roleAdmin.id;
		roleUserId = roleUser.id;
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /usuarios/all", () => {
		it("Teste 1: deve retornar todos os usuarios", async () => {
			const novoUsuario = criarUsuarioPayload({ roles: [{ id: roleUserId }] });
			await criarUsuarioNoBanco(app, novoUsuario);
			const response = await request(app.getHttpServer())
				.get("/usuarios/all")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)
			expect(response.body.data).toBeInstanceOf(Array)
		})
	})

	describe("GET /usuarios/:id", () => {
		it("Teste 2: deve retornar usuario quando ID existir", async () => {
			const novoUsuario = criarUsuarioPayload({ roles: [{ id: roleUserId }] });
			const createResponse = await criarUsuarioNoBanco(app, novoUsuario);
			if (!createResponse?.id) {
				throw new Error('Erro ao criar usuário: ' + JSON.stringify(createResponse));
			}
			const response = await request(app.getHttpServer())
				.get(`/usuarios/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)
			expect(response.body.data).toMatchObject({ id: createResponse.id, usuario: novoUsuario.usuario })
		})
		it("Teste 3: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/usuarios/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
		it("Teste 4: deve retornar 400 quando ID for inválido", async () => {
			await request(app.getHttpServer())
				.get("/usuarios/abc")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("POST /usuarios/cadastrar", () => {
		it("Teste 5: deve criar um novo usuario", async () => {
			const novoUsuario = criarUsuarioPayload({ roles: [{ id: roleUserId }] });
			const response = await criarUsuarioNoBanco(app, novoUsuario);
			expect(response).toHaveProperty("id")
			expect(response.usuario).toBe(novoUsuario.usuario)
		})
		it("Teste 6: deve retornar erro ao criar usuario sem usuario", async () => {
			await request(app.getHttpServer())
				.post("/usuarios/cadastrar")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "Sem Usuario", senha: "SenhaForte123!", roles: [{ id: roleUserId }] })
				.expect(HttpStatus.BAD_REQUEST)
		})
		it("Teste 7: deve retornar erro ao criar usuario com usuario duplicado", async () => {
			const usuario = `duplicado${Date.now()}@teste.com`;
			await criarUsuarioNoBanco(app, { usuario, roles: [{ id: roleUserId }] });
			await request(app.getHttpServer())
				.post("/usuarios/cadastrar")
				.set("Authorization", "Bearer mock-token")
				.send({ nome: "Outro", usuario, senha: "SenhaForte123!", roles: [{ id: roleUserId }] })
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /usuarios/atualizar", () => {
		it("Teste 8: deve atualizar um usuario existente", async () => {
			const usuarioUpdate = criarUsuarioPayload({ usuario: `usuario${Date.now()}4@teste.com`, nome: 'Usuário Teste', roles: [{ id: roleUserId }] });
			const createResponse = await criarUsuarioNoBanco(app, usuarioUpdate);

			const usuarioAtualizado = criarUsuarioUpdatePayload(createResponse.id, {
				nome: 'Nome Atualizado',
				usuario: usuarioUpdate.usuario,
				roles: [{ id: roleUserId }],
			});

			const response = await request(app.getHttpServer())
				.put("/usuarios/atualizar")
				.set("Authorization", "Bearer mock-token")
				.send(usuarioAtualizado)
				.expect(HttpStatus.OK);

			expect(response.body.data).toMatchObject({
				id: createResponse.id,
				usuario: usuarioUpdate.usuario,
				nome: 'Nome Atualizado',
			});
		})
		it("Teste 9: deve retornar erro ao atualizar usuario inexistente", async () => {
			const usuarioInexistente = criarUsuarioUpdatePayload(999, {
				usuario: 'inexistente@teste.com',
				nome: 'Usuário Inexistente',
				roles: [{ id: roleUserId }],
			});
			await request(app.getHttpServer())
				.put("/usuarios/atualizar")
				.set("Authorization", "Bearer mock-token")
				.send(usuarioInexistente)
				.expect(HttpStatus.NOT_FOUND)
		})
		it("Teste 10: deve retornar erro ao atualizar usuario com usuario duplicado", async () => {
			await criarUsuarioNoBanco(app, { usuario: 'duplicado@teste.com', roles: [{ id: roleUserId }] });
			const usuario2 = await criarUsuarioNoBanco(app, { usuario: 'outro@teste.com', roles: [{ id: roleUserId }] });
			const usuarioAtualizado = { id: usuario2.id, nome: "Teste", usuario: 'duplicado@teste.com', roles: [{ id: roleUserId }] };
			await request(app.getHttpServer())
				.put("/usuarios/atualizar")
				.set("Authorization", "Bearer mock-token")
				.send(usuarioAtualizado)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /usuarios/:id", () => {
		it("Teste 11: deve deletar um usuario existente", async () => {
			// Cria um usuário com role admin
			const novoUsuario = criarUsuarioPayload({ roles: [{ id: roleAdminId }] });
			const createResponse = await criarUsuarioNoBanco(app, novoUsuario);
			const usuarioId = createResponse.id;

			// Verifica se o usuário existe antes de deletar
			const getResponse = await request(app.getHttpServer())
				.get(`/usuarios/${usuarioId}`)
				.set("Authorization", "Bearer mock-token");
			if (getResponse.status !== 200) {
				throw new Error(`Usuário não existe antes do delete. Status: ${getResponse.status}`);
			}

			// O usuário autenticado precisa ter role admin para deletar
			await request(app.getHttpServer())
				.delete(`/usuarios/${usuarioId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT);
			await request(app.getHttpServer())
				.get(`/usuarios/${usuarioId}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND);
		})
		it("Teste 12: deve retornar erro ao deletar usuario inexistente", async () => {
			await request(app.getHttpServer())
				.delete("/usuarios/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
}) 
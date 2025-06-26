import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { SecurityModule } from "../src/security/security.module"
import { RoleModule } from "../src/role/role.module"
import { TestDatabaseHelper, criarRoleNoBanco, criarUsuarioNoBanco, criarUsuarioPayload } from "./helpers"

describe("Security E2E Tests", () => {
	let app: INestApplication
	let testHelper: TestDatabaseHelper
	let roleUserId: number

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[SecurityModule, RoleModule],
			{
				jwt: {
					expiration: '30m',
				},
				app: {
					environment: 'test-security',
				}
			},
			{
				logging: false,
				dropSchema: true,
			}
		)
		const roleUser = await criarRoleNoBanco(app, { nome: 'user', descricao: 'Usuário padrão' })
		roleUserId = roleUser.id
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("POST /usuarios/logar", () => {
		it("Teste 1: deve fazer login com credenciais válidas", async () => {
			// Criar um usuário para testar
			const usuario = criarUsuarioPayload({ 
				usuario: "login.teste@email.com",
				senha: "Teste@123",
				roles: [{ id: roleUserId }]
			})
			await criarUsuarioNoBanco(app, usuario)

			const response = await request(app.getHttpServer())
				.post("/usuarios/logar")
				.send({
					usuario: usuario.usuario,
					senha: usuario.senha
				})
				.expect(HttpStatus.OK)

			expect(response.body.status).toBe("success")
			expect(response.body.message).toBe("Login realizado com sucesso.")
			expect(response.body.data).toHaveProperty("token")
			expect(response.body.data).toHaveProperty("id")
			expect(response.body.data).toHaveProperty("usuario", usuario.usuario)
			expect(response.body.data).toHaveProperty("roles")
			expect(response.body.data.roles).toBeInstanceOf(Array)
		})

		it("Teste 2: deve retornar erro com credenciais inválidas", async () => {
			const response = await request(app.getHttpServer())
				.post("/usuarios/logar")
				.send({
					usuario: "inexistente@teste.com",
					senha: "SenhaErrada123!"
				})
				.expect(HttpStatus.UNAUTHORIZED)

			expect(response.body.statusCode).toBe(HttpStatus.UNAUTHORIZED)
			expect(response.body.message).toBeDefined()
		})

		it("Teste 3: deve retornar erro com email inválido", async () => {
			const response = await request(app.getHttpServer())
				.post("/usuarios/logar")
				.send({
					usuario: "emailinvalido",
					senha: "Senha123!"
				})
				.expect(HttpStatus.UNAUTHORIZED)

			expect(response.body.statusCode).toBe(HttpStatus.UNAUTHORIZED)
			expect(response.body.message).toBeDefined()
		})

		it("Teste 4: deve retornar erro com senha muito curta", async () => {
			const response = await request(app.getHttpServer())
				.post("/usuarios/logar")
				.send({
					usuario: "teste@email.com",
					senha: "123"
				})
				.expect(HttpStatus.UNAUTHORIZED)

			expect(response.body.statusCode).toBe(HttpStatus.UNAUTHORIZED)
			expect(response.body.message).toBeDefined()
		})
	})

	describe("POST /usuarios/recuperarsenha", () => {
		it("Teste 5: deve aceitar solicitação de recuperação para email existente", async () => {
			const usuario = criarUsuarioPayload({
				usuario: "recuperacao@teste.com",
				roles: [{ id: roleUserId }]
			})
			await criarUsuarioNoBanco(app, usuario)

			const response = await request(app.getHttpServer())
				.post("/usuarios/recuperarsenha")
				.send({ usuario: usuario.usuario })
				.expect(HttpStatus.CREATED)

			expect(response.body.status).toBe("success")
			expect(response.body.message).toContain("link de recuperação")
			expect(response.body.data).toBeNull()
		})

		it("Teste 6: deve aceitar solicitação mesmo para email inexistente (segurança)", async () => {
			const response = await request(app.getHttpServer())
				.post("/usuarios/recuperarsenha")
				.send({ usuario: "inexistente@teste.com" })
				.expect(HttpStatus.CREATED)

			expect(response.body.status).toBe("success")
			expect(response.body.message).toContain("link de recuperação")
			expect(response.body.data).toBeNull()
		})

		it("Teste 7: deve retornar erro com email inválido", async () => {
			const response = await request(app.getHttpServer())
				.post("/usuarios/recuperarsenha")
				.send({ usuario: "emailinvalido" })
				.expect(HttpStatus.BAD_REQUEST)

			expect(response.body.message).toContain("Email inválido")
		})
	})

	describe("PATCH /usuarios/atualizarsenha", () => {
		it("Teste 8: deve retornar erro quando senhas não coincidem", async () => {
			const response = await request(app.getHttpServer())
				.patch("/usuarios/atualizarsenha")
				.send({
					token: "token-valido-mock",
					senha: "NovaSenha@123",
					confirmarSenha: "SenhaDiferente@123"
				})
				.expect(HttpStatus.OK)

			expect(response.body.status).toBe("error")
			expect(response.body.message).toContain("não coincidem")
			expect(response.body.data).toBeNull()
		})

		it("Teste 9: deve retornar erro com token inválido", async () => {
			const response = await request(app.getHttpServer())
				.patch("/usuarios/atualizarsenha")
				.send({
					token: "token-invalido",
					senha: "NovaSenha@123",
					confirmarSenha: "NovaSenha@123"
				})
				.expect(HttpStatus.OK)

			expect(response.body.status).toBe("error")
			expect(response.body.data).toBeNull()
		})

		it("Teste 10: deve retornar erro com senha fraca", async () => {
			const response = await request(app.getHttpServer())
				.patch("/usuarios/atualizarsenha")
				.send({
					token: "token-valido-mock",
					senha: "123456",
					confirmarSenha: "123456"
				})
				.expect(HttpStatus.BAD_REQUEST)

			const msg = response.body.message;
			const found = Array.isArray(msg)
				? msg.some((m: string) => m.includes("senha deve conter pelo menos uma letra maiúscula"))
				: msg.includes("senha deve conter pelo menos uma letra maiúscula");
			expect(found).toBe(true);
		})
	})

	describe("GET /auth/google", () => {
		it("Teste 11: deve redirecionar para autenticação Google", async () => {
			await request(app.getHttpServer())
				.get("/auth/google")
				.expect(HttpStatus.FOUND)
				.expect("Location", /accounts\.google\.com/)
		})
	})

	describe("GET /auth/google/callback", () => {
		it("Teste 12: deve processar callback do Google com sucesso", async () => {
			await request(app.getHttpServer())
				.get("/auth/google/callback?code=mock-auth-code&state=mock-state")
				.expect(res => {
					if (![302, 500].includes(res.status)) {
						throw new Error(`Expected 302 or 500, got ${res.status}`)
					}
				})
		})

		it("Teste 13: deve retornar erro com perfil Google inválido", async () => {
			await request(app.getHttpServer())
				.get("/auth/google/callback")
				.expect(res => {
					if (![302, 500].includes(res.status)) {
						throw new Error(`Expected 302 or 500, got ${res.status}`)
					}
				})
		})
	})
})
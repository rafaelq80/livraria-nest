import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { AutorModule } from "../src/autor/autor.module"
import { Autor } from "../src/autor/entities/autor.entity"
import { AutorService } from "../src/autor/services/autor.service"
import { CategoriaModule } from "../src/categoria/categoria.module"
import { Categoria } from "../src/categoria/entities/categoria.entity"
import { CategoriaService } from "../src/categoria/services/categoria.service"
import { EditoraModule } from "../src/editora/editora.module"
import { Editora } from "../src/editora/entities/editora.entity"
import { EditoraService } from "../src/editora/services/editora.service"
import { ProdutoModule } from "../src/produto/produto.module"
import { TestDatabaseHelper } from "./helpers/test-database.helper"
import {
	criarProdutoPayload,
	criarProdutoInvalidoPayload,
	criarProdutoUpdatePayload,
	criarProdutoNoBanco
} from "./helpers/payloads"
import { gerarISBN10, gerarISBN13 } from './helpers/generators'
import { CriarProdutoDto } from "../src/produto/dtos/criarproduto.dto"
import { AtualizarProdutoDto } from "../src/produto/dtos/atualizarproduto.dto"

describe("ProdutoController (e2e)", () => {
	let app: INestApplication
	let testeCategoria: Categoria
	let testeEditora: Editora
	let testeAutor: Autor
	let categoriaService: CategoriaService
	let editoraService: EditoraService
	let autorService: AutorService
	let novoProduto: CriarProdutoDto
	let updateProduto: AtualizarProdutoDto
	let testHelper: TestDatabaseHelper

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule([
			ProdutoModule,
			CategoriaModule,
			EditoraModule,
			AutorModule
		])

		categoriaService = app.get<CategoriaService>(CategoriaService)
		editoraService = app.get<EditoraService>(EditoraService)
		autorService = app.get<AutorService>(AutorService)

		testeCategoria = await categoriaService.create({
			tipo: "Teste Categoria",
		} as Categoria)

		testeEditora = await editoraService.create({
			nome: "Teste Editora",
		} as Editora)

		testeAutor = await autorService.create({
			nome: "Teste Autor",
		} as Autor)
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /produtos", () => {
		it("Teste 1: deve retornar lista vazia quando não houver produtos", async () => {
			const response = await request(app.getHttpServer())
				.get("/produtos")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})

		it("Teste 2: deve retornar lista de produtos quando existirem produtos", async () => {
			await criarProdutoNoBanco(app, testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			const response = await request(app.getHttpServer())
				.get("/produtos")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
		})
	})

	describe("GET /produtos/:id", () => {
		it("Teste 3: deve retornar produto quando ID existir", async () => {
			const createResponse = await criarProdutoNoBanco(app, testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			const response = await request(app.getHttpServer())
				.get(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				titulo: createResponse.body.titulo,
				preco: createResponse.body.preco,
			})
		})

		it("Teste 4: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /produtos/titulo/:titulo", () => {
		it("Teste 5: deve retornar lista de produtos quando título existir", async () => {
			const novoProduto = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get(`/produtos/titulo/${novoProduto.titulo}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
			expect(response.body[0]).toMatchObject({
				titulo: novoProduto.titulo,
				preco: novoProduto.preco,
			})
		})

		it("Teste 6: deve retornar lista vazia quando título não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/produtos/titulo/TituloInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})

	describe("POST /produtos", () => {
		it("Teste 7: deve criar produto quando dados forem válidos", async () => {
			novoProduto = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.titulo).toBe(novoProduto.titulo)
		})

		it("Teste 8: deve retornar 400 quando dados forem inválidos", async () => {
			const produtoInvalido = criarProdutoInvalidoPayload(testeCategoria, testeEditora, testeAutor);
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})

		// Teste 9: POST /produtos com ISBN já existente
		it("Teste 9: deve retornar 400 ao tentar criar produto com ISBN já existente", async () => {
			const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
			const isbn10 = gerarISBN10();
			const isbn13 = gerarISBN13();
			const produto1 = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { isbn10, isbn13, titulo: "Livro 1" });
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produto1)
				.expect(HttpStatus.CREATED);
			const produto2 = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { isbn10, isbn13, titulo: "Livro 2" });
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produto2)
				.expect(HttpStatus.BAD_REQUEST);
			expect(response.body.message).toMatch(/ISBN/);
			loggerErrorSpy.mockRestore();
		})

		// Teste 10: POST /produtos com categoria/editora/autor inexistente
		it("Teste 10: deve retornar 400 ou 404 ao tentar criar produto com categoria/editora/autor inexistente", async () => {
			const produtoInvalido = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, {
				titulo: "Livro Inválido",
				categoria: { id: 9999 },
				editora: { id: 9999 },
				autores: [{ id: 9999 }],
			});
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(res => {
					if (![400, 404].includes(res.status)) {
						throw new Error(`Expected status 400 or 404, got ${res.status}`);
					}
				});
			expect(Array.isArray(response.body.message) || typeof response.body.message === 'string').toBe(true);
		});

		// Teste 11: POST /produtos com payload contendo campos extras
		it("Teste 11: deve retornar 400 ao tentar criar produto com campos extras no payload", async () => {
			const produtoExtra = { ...criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "Livro Extra" }), campoInvalido: "não deveria estar aqui" };
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoExtra)
				.expect(HttpStatus.BAD_REQUEST);
			if (Array.isArray(response.body.message)) {
				expect(response.body.message.join(' ')).toContain("campoInvalido");
			} else {
				expect(response.body.message).toContain("campoInvalido");
			}
		});

		// Teste 12: POST /produtos com upload de foto (se aplicável)
		it("Teste 12: deve criar produto com upload de foto", async () => {
			const produtoComFoto = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "Livro com Foto" });
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", produtoComFoto.titulo)
				.field("sinopse", produtoComFoto.sinopse)
				.field("paginas", produtoComFoto.paginas)
				.field("anoPublicacao", produtoComFoto.anoPublicacao)
				.field("preco", produtoComFoto.preco)
				.field("idioma", produtoComFoto.idioma)
				.field("isbn10", produtoComFoto.isbn10)
				.field("isbn13", produtoComFoto.isbn13)
				.field("desconto", produtoComFoto.desconto)
				.field("edicao", produtoComFoto.edicao)
				.field("categoria[id]", produtoComFoto.categoria.id)
				.field("editora[id]", produtoComFoto.editora.id)
				.field("autores[0][id]", produtoComFoto.autores[0].id)
				.attach("fotoFile", Buffer.from("fake image content"), "foto.jpg")
			const { status, body } = response;
			expect(status).toBe(HttpStatus.CREATED);
			expect(body).toHaveProperty("id");
			expect(body).toHaveProperty("foto");
		});
	})

	describe("PUT /produtos", () => {
		it("Teste 13: deve atualizar produto quando ID existir", async () => {
			novoProduto = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13);
			const createResponse = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			updateProduto = criarProdutoUpdatePayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, createResponse.body.id, {
				titulo: "JavaScript Atualizado",
				preco: 99.99,
				...novoProduto
			});

			const response = await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(updateProduto)
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				titulo: updateProduto.titulo,
				preco: updateProduto.preco,
			})
		})

		it("Teste 14: deve retornar 404 quando ID não existir", async () => {
			updateProduto = criarProdutoUpdatePayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, 999, {
				titulo: "JavaScript Descomplicado",
				sinopse: "Uma sinopse válida do livro para passar na validação.",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Português",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				desconto: 0,
				edicao: 1,
				categoria: { id: testeCategoria.id },
				editora: { id: testeEditora.id },
				autores: [{ id: testeAutor.id }],
			});

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(updateProduto)
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 15: deve retornar 400 quando dados forem inválidos", async () => {
			novoProduto = criarProdutoPayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const produtoInvalido = criarProdutoUpdatePayload(testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, response.body.id, {
				titulo: "JS",
				sinopse: "curta",
				paginas: 0,
				anoPublicacao: 1799,
				preco: -10,
				idioma: "Chinês",
				isbn10: "123",
				isbn13: "456",
				categoria: { id: testeCategoria.id },
				editora: { id: testeEditora.id },
				autores: [{ id: testeAutor.id }],
			});

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /produtos/:id", () => {
		it("Teste 16: deve remover produto quando ID existir", async () => {
			const createResponse = await criarProdutoNoBanco(app, testeCategoria, testeEditora, testeAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript muito Descomplicado" });
			expect(createResponse.status).toBe(HttpStatus.CREATED)

			await request(app.getHttpServer())
				.delete(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			await request(app.getHttpServer())
				.get(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 17: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.delete("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

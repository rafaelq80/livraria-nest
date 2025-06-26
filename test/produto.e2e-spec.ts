import { HttpStatus, INestApplication, Logger } from "@nestjs/common"
import * as request from "supertest"
import { Autor } from "../src/autor/entities/autor.entity"
import { AutorService } from "../src/autor/services/autor.service"
import { Categoria } from "../src/categoria/entities/categoria.entity"
import { Editora } from "../src/editora/entities/editora.entity"
import { AtualizarProdutoDto } from "../src/produto/dtos/atualizarproduto.dto"
import { CriarProdutoDto } from "../src/produto/dtos/criarproduto.dto"
import { ProdutoModule } from "../src/produto/produto.module"
import { CategoriaModule } from "../src/categoria/categoria.module"
import { EditoraModule } from "../src/editora/editora.module"
import { AutorModule } from "../src/autor/autor.module"
import {
	criarAutorNoBanco,
	criarCategoriaNoBanco,
	criarEditoraNoBanco,
	criarProdutoInvalidoPayload,
	criarProdutoNoBanco,
	criarProdutoPayload,
	criarProdutoUpdatePayload,
	gerarISBN10,
	gerarISBN13,
	TestDatabaseHelper
} from './helpers'

describe("Produto E2E Tests", () => {
	let testHelper: TestDatabaseHelper
	let app: INestApplication
	let testCategoria: Categoria
	let testEditora: Editora
	let testAutor: Autor
	let testAutor2: Autor
	let autorService: AutorService
	let novoProduto: CriarProdutoDto
	let updateProduto: AtualizarProdutoDto

	beforeAll(async () => {
		testHelper = new TestDatabaseHelper()
		app = await testHelper.createTestModule(
			[ProdutoModule, AutorModule, CategoriaModule, EditoraModule],
			{
				// Configurações específicas para testes de produto
				jwt: {
					expiration: '1h',
				},
				app: {
					environment: 'test-produto',
				}
			}
		)

		// Criar entidades necessárias para os testes
		testCategoria = await criarCategoriaNoBanco(app, { tipo: 'Ficção' });
		testEditora = await criarEditoraNoBanco(app, { nome: 'Editora Teste' });
		testAutor = await criarAutorNoBanco(app, { nome: 'Autor Teste' });

		autorService = app.get<AutorService>(AutorService)

		testAutor2 = await autorService.create({
			nome: "Teste Autor 2",
		} as Autor)

		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
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

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})

		it("Teste 2: deve retornar lista de produtos quando existirem produtos", async () => {
			await criarProdutoNoBanco(app, testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			const response = await request(app.getHttpServer())
				.get("/produtos")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
		})
	})

	describe("GET /produtos/:id", () => {
		it("Teste 3: deve retornar produto quando ID existir", async () => {
			const createResponse = await criarProdutoNoBanco(app, testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			const response = await request(app.getHttpServer())
				.get(`/produtos/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)
			expect(response.body.data).toMatchObject({ id: createResponse.id, titulo: "JavaScript Descomplicado" })
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
			const novoProduto = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { titulo: "JavaScript Descomplicado" });
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get(`/produtos/titulo/${novoProduto.titulo}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBeGreaterThan(0)
			expect(response.body.data[0]).toMatchObject({
				titulo: novoProduto.titulo,
				preco: novoProduto.preco,
			})
		})

		it("Teste 6: deve retornar lista vazia quando título não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/produtos/titulo/TituloInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body.data).toBeInstanceOf(Array)
			expect(response.body.data.length).toBe(0)
		})
	})

	describe("POST /produtos", () => {
		it("Teste 7: deve criar produto quando dados forem válidos", async () => {
			novoProduto = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			expect(response.body.data).toHaveProperty("id")
			expect(response.body.data.titulo).toBe(novoProduto.titulo)
		})

		it("Teste 8: deve retornar 400 quando dados forem inválidos", async () => {
			const produtoInvalido = criarProdutoInvalidoPayload(testCategoria, testEditora, testAutor);
			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})

		it("Teste 9: deve retornar 400 ao tentar criar produto com ISBN já existente", async () => {
			const produto1 = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { isbn10: "1234567890", isbn13: "1234567890123" });
			await criarProdutoNoBanco(app, testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, produto1);
			const produto2 = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { isbn10: "1234567890", isbn13: "1234567890123" });
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produto2)
				.expect(HttpStatus.BAD_REQUEST);
			if (Array.isArray(response.body.message)) {
				expect(response.body.message.join(' ')).toMatch(/ISBN/);
			} else {
				expect(response.body.message).toMatch(/ISBN/);
			}
		})

		it("Teste 10: deve retornar 400 ou 404 ao tentar criar produto com categoria/editora/autor inexistente", async () => {
			const produtoInvalido = criarProdutoPayload({ id: 999 }, { id: 999 }, { id: 999 }, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(res => {
					if (![400, 404].includes(res.status)) throw new Error("Esperado 400 ou 404");
				});
			expect(Array.isArray(response.body.message) || typeof response.body.message === 'string').toBe(true);
		})

		it("Teste 11: deve retornar 400 ao tentar criar produto com campos extras no payload", async () => {
			const produtoExtra = { ...criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13), campoInvalido: "valor" };
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
		})

		it("Teste 12: deve criar produto com upload de foto", async () => {
			const produtoFoto = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.field("titulo", produtoFoto.titulo)
				.field("sinopse", produtoFoto.sinopse)
				.field("paginas", produtoFoto.paginas)
				.field("anoPublicacao", produtoFoto.anoPublicacao)
				.field("preco", produtoFoto.preco)
				.field("idioma", produtoFoto.idioma)
				.field("isbn10", produtoFoto.isbn10)
				.field("isbn13", produtoFoto.isbn13)
				.field("desconto", produtoFoto.desconto)
				.field("edicao", produtoFoto.edicao)
				.field("categoria[id]", testCategoria.id)
				.field("editora[id]", testEditora.id)
				.field("autores[0][id]", testAutor.id)
				.attach("fotoFile", Buffer.from("fake image content"), "foto.jpg")
			const { status, body } = response;
			console.log('UPLOAD FOTO RESPONSE:', body);
			expect(status).toBe(HttpStatus.CREATED);
			expect(body.data).toHaveProperty("id");
			expect(body.data).toHaveProperty("foto");
		})

		it("Teste 13: deve criar produto com múltiplos autores", async () => {
			const produtoMultiplosAutores = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, { 
				titulo: "Livro com Múltiplos Autores",
				autores: [
					{ id: testAutor.id },
					{ id: testAutor2.id }
				]
			});
			
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoMultiplosAutores)
				.expect(HttpStatus.CREATED);

			expect(response.body.data).toHaveProperty("id");
			expect(response.body.data.titulo).toBe(produtoMultiplosAutores.titulo);
			expect(response.body.data.autores).toBeInstanceOf(Array);
			expect(response.body.data.autores.length).toBe(2);
			expect(response.body.data.autores).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: testAutor.id }),
					expect.objectContaining({ id: testAutor2.id })
				])
			);
		});
	})

	describe("PUT /produtos", () => {
		it("Teste 14: deve atualizar produto quando ID existir", async () => {
			novoProduto = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13);
			const createResponse = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			updateProduto = criarProdutoUpdatePayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, createResponse.body.data.id, {
				titulo: "JavaScript Atualizado",
				preco: 99.99,
				...novoProduto
			});

			const response = await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(updateProduto)
				.expect(HttpStatus.OK)

			expect(response.body.data).toMatchObject({
				id: createResponse.body.data.id,
				titulo: updateProduto.titulo,
				preco: updateProduto.preco,
			})
		})

		it("Teste 15: deve retornar 404 quando ID não existir", async () => {
			updateProduto = criarProdutoUpdatePayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, 999, {
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
				categoria: { id: testCategoria.id },
				editora: { id: testEditora.id },
				autores: [{ id: testAutor.id }],
			});

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(updateProduto)
				.expect(HttpStatus.NOT_FOUND)
		})

		it("Teste 16: deve retornar 400 quando dados forem inválidos", async () => {
			novoProduto = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13);
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const produtoInvalido = criarProdutoUpdatePayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, response.body.data.id, {
				titulo: "JS",
				sinopse: "curta",
				paginas: 0,
				anoPublicacao: 1799,
				preco: -10,
				idioma: "Chinês",
				isbn10: "123",
				isbn13: "456",
				categoria: { id: testCategoria.id },
				editora: { id: testEditora.id },
				autores: [{ id: testAutor.id }],
			});

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /produtos/:id", () => {
		it("Teste 17: deve remover produto quando ID existir", async () => {
			const createResponse = await criarProdutoNoBanco(app, testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13);
			await request(app.getHttpServer())
				.delete(`/produtos/${createResponse.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)
		})

		it("Teste 18: deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.delete("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

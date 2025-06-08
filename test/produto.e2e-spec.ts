import { HttpStatus, INestApplication } from "@nestjs/common"
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

interface CreateProdutoDto {
	titulo: string
	sinopse: string
	preco: number
	paginas: number
	anoPublicacao: number
	idioma: string
	isbn10: string
	isbn13: string
	categoria: Categoria
	editora: Editora
	autores: Autor[]
	desconto?: number
}

interface UpdateProdutoDto {
	id: number
	titulo: string
	sinopse: string
	preco: number
	paginas: number
	anoPublicacao: number
	idioma: string
	isbn10: string
	isbn13: string
	categoria: Categoria
	editora: Editora
	autores: Autor[]
	desconto?: number
}

describe("ProdutoController (e2e)", () => {
	let app: INestApplication
	let testCategoria: Categoria
	let testEditora: Editora
	let testAutor: Autor
	let categoriaService: CategoriaService
	let editoraService: EditoraService
	let autorService: AutorService
	let novoProduto: CreateProdutoDto
	let updateProduto: UpdateProdutoDto
	let testHelper: TestDatabaseHelper

	function gerarISBN10(): string {
		const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
		let soma = 0
		for (let i = 0; i < 9; i++) {
			soma += parseInt(digitos[i]) * (10 - i)
		}
		const digitoVerificador = (11 - (soma % 11)) % 11
		return digitos + (digitoVerificador === 10 ? 'X' : digitoVerificador.toString())
	}

	function gerarISBN13(): string {
		const prefixo = Math.random() < 0.5 ? '978' : '979'
		const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
		let soma = 0
		for (let i = 0; i < 12; i++) {
			const digito = parseInt((prefixo + digitos)[i])
			soma += digito * (i % 2 === 0 ? 1 : 3)
		}
		const digitoVerificador = (10 - (soma % 10)) % 10
		return prefixo + digitos + digitoVerificador.toString()
	}

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

		testCategoria = await categoriaService.create({
			tipo: "Test Category",
		} as Categoria)

		testEditora = await editoraService.create({
			nome: "Test Publisher",
		} as Editora)

		testAutor = await autorService.create({
			nome: "Test Author",
		} as Autor)
	})

	afterAll(async () => {
		await testHelper.cleanup()
	})

	describe("GET /produtos", () => {
		it("deve retornar lista vazia quando não houver produtos", async () => {
			const response = await request(app.getHttpServer())
				.get("/produtos")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})

		it("deve retornar lista de produtos quando existirem produtos", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get("/produtos")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBeGreaterThan(0)
		})
	})

	describe("GET /produtos/:id", () => {
		it("deve retornar produto quando ID existir", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			const createResponse = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const response = await request(app.getHttpServer())
				.get(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toMatchObject({
				id: createResponse.body.id,
				titulo: novoProduto.titulo,
				preco: novoProduto.preco,
			})
		})

		it("deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.get("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})

	describe("GET /produtos/titulo/:titulo", () => {
		it("deve retornar lista de produtos quando título existir", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

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

		it("deve retornar lista vazia quando título não existir", async () => {
			const response = await request(app.getHttpServer())
				.get("/produtos/titulo/TituloInexistente")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.OK)

			expect(response.body).toBeInstanceOf(Array)
			expect(response.body.length).toBe(0)
		})
	})

	describe("POST /produtos", () => {
		it("deve criar produto quando dados forem válidos", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			expect(response.body).toHaveProperty("id")
			expect(response.body.titulo).toBe(novoProduto.titulo)
		})

		it("deve retornar 400 quando dados forem inválidos", async () => {
			const produtoInvalido = {
				titulo: "JS",
				sinopse: "curta",
				paginas: 0,
				anoPublicacao: 1799,
				preco: -10,
				idioma: "Chinês",
				isbn10: "123",
				isbn13: "456",
			}

			await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("PUT /produtos", () => {
		it("deve atualizar produto quando ID existir", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			const createResponse = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			updateProduto = {
				id: createResponse.body.id,
				...novoProduto,
				titulo: "JavaScript Atualizado",
				preco: 99.99,
			}

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

		it("deve retornar 404 quando ID não existir", async () => {
			updateProduto = {
				id: 999,
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(updateProduto)
				.expect(HttpStatus.NOT_FOUND)
		})

		it("deve retornar 400 quando dados forem inválidos", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			const produtoInvalido = {
				id: response.body.id,
				titulo: "JS",
				sinopse: "curta",
				paginas: 0,
				anoPublicacao: 1799,
				preco: -10,
				idioma: "Chinês",
				isbn10: "123",
				isbn13: "456",
			}

			await request(app.getHttpServer())
				.put("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(produtoInvalido)
				.expect(HttpStatus.BAD_REQUEST)
		})
	})

	describe("DELETE /produtos/:id", () => {
		it("deve remover produto quando ID existir", async () => {
			novoProduto = {
				titulo: "JavaScript Descomplicado",
				sinopse: "sinopse do livro",
				paginas: 250,
				anoPublicacao: 2022,
				preco: 88.96,
				idioma: "Portugês",
				isbn10: gerarISBN10(),
				isbn13: gerarISBN13(),
				categoria: testCategoria,
				editora: testEditora,
				autores: [testAutor],
			}

			const createResponse = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", "Bearer mock-token")
				.send(novoProduto)
				.expect(HttpStatus.CREATED)

			await request(app.getHttpServer())
				.delete(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NO_CONTENT)

			await request(app.getHttpServer())
				.get(`/produtos/${createResponse.body.id}`)
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})

		it("deve retornar 404 quando ID não existir", async () => {
			await request(app.getHttpServer())
				.delete("/produtos/999")
				.set("Authorization", "Bearer mock-token")
				.expect(HttpStatus.NOT_FOUND)
		})
	})
})

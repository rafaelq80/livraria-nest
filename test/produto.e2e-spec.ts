import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { Autor } from "../src/autor/entities/autor.entity"
import { Categoria } from "../src/categoria/entities/categoria.entity"
import { Editora } from "../src/editora/entities/editora.entity"
import { EntityMocks } from "./helpers/entity-mocks.helper"
import { RepositoryMocks } from "./helpers/repository-mocks.helper"
import { E2ETestSetup } from "./helpers/test-setup.helper"
import {
	AutorMock,
	CategoriaMock,
	EditoraMock,
	MockRepository,
	ProdutoMock,
} from "./helpers/types.helper"
import { Produto } from "../src/produto/entities/produto.entity"

describe("ProdutoController (e2e)", () => {
	let testSetup: E2ETestSetup
	let app: INestApplication
	let token: string

	// Mocks dos repositórios
	let produtoRepositoryMock: MockRepository<ProdutoMock>
	let autorRepositoryMock: MockRepository<AutorMock>
	let categoriaRepositoryMock: MockRepository<CategoriaMock>
	let editoraRepositoryMock: MockRepository<EditoraMock>

	// Dados de teste
	let mockAutores: AutorMock[]
	let mockCategoria: CategoriaMock
	let mockEditora: EditoraMock
	let mockProduto: ProdutoMock
	let mockProdutoComAutores: ProdutoMock

	beforeAll(async () => {
		testSetup = new E2ETestSetup()

		// Criar dados de teste com relação N:N
		mockAutores = [
			EntityMocks.createAutorMock({
				id: 1,
				nome: "Machado de Assis",
				nacionalidade: "Brasileira",
			}),
			EntityMocks.createAutorMock({
				id: 2,
				nome: "Clarice Lispector",
				nacionalidade: "Brasileira",
			}),
		]

		mockCategoria = EntityMocks.createCategoriaMock({
			id: 1,
			tipo: "Literatura Clássica",
		})

		mockEditora = EntityMocks.createEditoraMock({
			id: 1,
			nome: "Companhia das Letras",
		})

		mockProduto = EntityMocks.createProdutoMock({
			id: 1,
			titulo: "Dom Casmurro",
			descricao: "Romance clássico da literatura brasileira",
			preco: 45.9,
			desconto: 0,
			foto: "dom-casmurro.jpg",
			paginas: 256,
			idioma: "Português",
			isbn10: "0262033844",
			isbn13: "9780262033848",
			categoria: mockCategoria,
			editora: mockEditora,
			autores: [mockAutores[0]],
		})

		mockProdutoComAutores = EntityMocks.createProdutoMock({
			id: 2,
			titulo: "Antologia Literária",
			descricao: "Coletânea de textos de grandes autores",
			preco: 89.9,
			desconto: 15.5,
			foto: "antologia-literaria.jpg",
			paginas: 450,
			idioma: "Português",
			isbn10: "0134685991",
			isbn13: "9780134685991",
			categoria: mockCategoria,
			editora: mockEditora,
			autores: mockAutores,
		})

		// Configurar mocks dos repositórios
		produtoRepositoryMock = RepositoryMocks.createProdutoRepositoryMock([
			mockProduto,
			mockProdutoComAutores,
		])
		autorRepositoryMock = RepositoryMocks.createAutorRepositoryMock(mockAutores)
		categoriaRepositoryMock = RepositoryMocks.createCategoriaRepositoryMock([mockCategoria])
		editoraRepositoryMock = RepositoryMocks.createEditoraRepositoryMock([mockEditora])

		// Configurar comportamentos específicos para findOne
		;(produtoRepositoryMock.findOne as jest.Mock).mockImplementation(
			(options?: {
				where?: { id?: number }
				relations?: string[] | Record<string, boolean>
			}) => {
				if (options?.where?.id === 1) {
					return Promise.resolve(mockProduto)
				}
				if (options?.where?.id === 2) {
					return Promise.resolve(mockProdutoComAutores)
				}
				return Promise.resolve(null)
			},
		)

		// Mock para buscar produtos com relações
		;(produtoRepositoryMock.find as jest.Mock).mockImplementation(
			(options?: {
				relations?: string[] | Record<string, boolean>
				where?: Record<string, unknown>
				cache?: boolean
				order?: Record<string, string>
			}) => {
				if (options?.relations) {
					return Promise.resolve([
						{ ...mockProduto, autores: [mockAutores[0]] },
						{ ...mockProdutoComAutores, autores: mockAutores },
					])
				}
				return Promise.resolve([mockProduto, mockProdutoComAutores])
			},
		)

		// Mock para categoria, editora e autores (busca por ID)
		;(categoriaRepositoryMock.findOne as jest.Mock).mockImplementation(
			(options?: { where?: { id?: number } }) => {
				if (options?.where?.id === 1) {
					return Promise.resolve(mockCategoria)
				}
				return Promise.resolve(null)
			},
		)
		;(editoraRepositoryMock.findOne as jest.Mock).mockImplementation(
			(options?: { where?: { id?: number } }) => {
				if (options?.where?.id === 1) {
					return Promise.resolve(mockEditora)
				}
				return Promise.resolve(null)
			},
		)
		;(autorRepositoryMock.findOne as jest.Mock).mockImplementation(
			(options?: { where?: { id?: number } }) => {
				const autor = mockAutores.find((a) => a.id === options?.where?.id)
				return Promise.resolve(autor || null)
			},
		)

		await testSetup.setupTestModule({
			entities: [Produto, Autor, Categoria, Editora],
			repositoryMocks: {
				Produto: produtoRepositoryMock,
				Autor: autorRepositoryMock,
				Categoria: categoriaRepositoryMock,
				Editora: editoraRepositoryMock,
			},
		})

		app = testSetup.getApp()
		token = testSetup.getToken()
	})

	afterAll(async () => {
		await testSetup.closeApp()
	})

	beforeEach(() => {
		E2ETestSetup.clearAllMocks()
	})

	describe("POST /produtos", () => {
		it("deve criar produto com foto e autenticação", async () => {
			const novoProduto = {
				titulo: "O Cortiço",
				descricao: "Romance naturalista brasileiro",
				preco: 39.9,
				desconto: 5.0,
				foto: "o-cortico.jpg",
				paginas: 280,
				idioma: "Português",
				isbn10: "0321356683",
				isbn13: "9780321356680",
				categoriaId: 1,
				editoraId: 1,
				autoresIds: [1],
			}

			const produtoSalvo: ProdutoMock = {
				id: 3,
				titulo: novoProduto.titulo,
				descricao: novoProduto.descricao,
				preco: novoProduto.preco,
				desconto: novoProduto.desconto,
				foto: novoProduto.foto,
				paginas: novoProduto.paginas,
				idioma: novoProduto.idioma,
				isbn10: novoProduto.isbn10,
				isbn13: novoProduto.isbn13,
				categoria: mockCategoria,
				editora: mockEditora,
				autores: [mockAutores[0]],
			}

			;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue(produtoSalvo)

			// Criar buffer da imagem com conteúdo de imagem válido (JPEG)
			const imageBuffer = Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
			])

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", novoProduto.titulo)
				.field("descricao", novoProduto.descricao)
				.field("preco", novoProduto.preco.toString())
				.field("desconto", novoProduto.desconto.toString())
				.field("paginas", novoProduto.paginas.toString())
				.field("idioma", novoProduto.idioma)
				.field("isbn10", novoProduto.isbn10)
				.field("isbn13", novoProduto.isbn13)
				.field("categoriaId", novoProduto.categoriaId.toString())
				.field("editoraId", novoProduto.editoraId.toString())
				.field("autoresIds", novoProduto.autoresIds[0].toString())
				.attach("foto", imageBuffer, {
					filename: "test.jpg",
					contentType: "image/jpeg",
				})

			// Debug informativo
			if (response.status !== 201) {
				console.log("Response status:", response.status)
				console.log("Response body:", response.body)
				console.log("Response text:", response.text)
			}

			expect(response.status).toBe(201)
			expect(response.body).toMatchObject({
				id: expect.any(Number),
				titulo: "O Cortiço",
				descricao: "Romance naturalista brasileiro",
				preco: 39.9,
			})
		})

		it("deve retornar erro 401 sem autenticação", async () => {
			const imageBuffer = Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
			])

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "1")
				.field("editoraId", "1")
				.field("autoresIds", "1")
				.attach("foto", imageBuffer, {
					filename: "test.jpg",
					contentType: "image/jpeg",
				})

			expect(response.status).toBe(401)
		})

		it("deve retornar erro 400 com tipo de arquivo inválido", async () => {
			const textBuffer = Buffer.from("Este é um arquivo de texto")

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "1")
				.field("editoraId", "1")
				.field("autoresIds", "1")
				.attach("foto", textBuffer, {
					filename: "test.txt",
					contentType: "text/plain",
				})

			expect(response.status).toBe(400)
		})

		it("deve validar campos obrigatórios", async () => {
			const imageBuffer = Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
			])

			// Teste sem título
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "1")
				.field("editoraId", "1")
				.field("autoresIds", "1")
				.attach("foto", imageBuffer, {
					filename: "test.jpg",
					contentType: "image/jpeg",
				})

			expect(response.status).toBe(400)
		})

		it("deve validar ISBN formato", async () => {
			const imageBuffer = Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
			])

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "isbn-invalido")
				.field("isbn13", "isbn13-invalido")
				.field("categoriaId", "1")
				.field("editoraId", "1")
				.field("autoresIds", "1")
				.attach("foto", imageBuffer, {
					filename: "test.jpg",
					contentType: "image/jpeg",
				})

			expect(response.status).toBe(400)
			expect(response.body.message).toEqual(
				expect.arrayContaining([expect.stringContaining("ISBN")]),
			)
		})

		it("deve validar percentual de desconto", async () => {
			const imageBuffer = Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
			])

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "150") // Desconto inválido (> 100%)
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "1")
				.field("editoraId", "1")
				.field("autoresIds", "1")
				.attach("foto", imageBuffer, {
					filename: "test.jpg",
					contentType: "image/jpeg",
				})

			expect(response.status).toBe(400)
		})

		it("deve criar produto sem foto (campo opcional)", async () => {
			const novoProduto = {
				titulo: "Produto Sem Foto",
				descricao: "Teste criação sem imagem",
				preco: 25.0,
				desconto: 0,
				paginas: 150,
				idioma: "Português",
				isbn10: "0451524934",
				isbn13: "9780451524935",
				categoriaId: 1,
				editoraId: 1,
				autoresIds: [1],
			}

			const produtoSalvo: ProdutoMock = {
				id: 4,
				titulo: novoProduto.titulo,
				descricao: novoProduto.descricao,
				preco: novoProduto.preco,
				desconto: novoProduto.desconto,
				foto: null,
				paginas: novoProduto.paginas,
				idioma: novoProduto.idioma,
				isbn10: novoProduto.isbn10,
				isbn13: novoProduto.isbn13,
				categoria: mockCategoria,
				editora: mockEditora,
				autores: [mockAutores[0]],
			}

			;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue(produtoSalvo)

			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", novoProduto.titulo)
				.field("descricao", novoProduto.descricao)
				.field("preco", novoProduto.preco.toString())
				.field("desconto", novoProduto.desconto.toString())
				.field("paginas", novoProduto.paginas.toString())
				.field("idioma", novoProduto.idioma)
				.field("isbn10", novoProduto.isbn10)
				.field("isbn13", novoProduto.isbn13)
				.field("categoriaId", novoProduto.categoriaId.toString())
				.field("editoraId", novoProduto.editoraId.toString())
				.field("autoresIds", novoProduto.autoresIds[0].toString())

			expect(response.status).toBe(201)
			expect(response.body.titulo).toBe("Produto Sem Foto")
		})

		it("deve validar categoria inexistente", async () => {
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "999") // ID inexistente
				.field("editoraId", "1")
				.field("autoresIds", "1")

			expect(response.status).toBe(400)
		})

		it("deve validar editora inexistente", async () => {
			const response = await request(app.getHttpServer())
				.post("/produtos")
				.set("Authorization", `Bearer ${token}`)
				.field("titulo", "Teste")
				.field("descricao", "Descrição teste")
				.field("preco", "29.90")
				.field("desconto", "0")
				.field("paginas", "100")
				.field("idioma", "Português")
				.field("isbn10", "0385504209")
				.field("isbn13", "9780385504201")
				.field("categoriaId", "1")
				.field("editoraId", "999") // ID inexistente
				.field("autoresIds", "1")

			expect(response.status).toBe(400)
		})
	})

	// describe("PUT /produtos", () => {
	// 	it("deve atualizar produto com foto opcional e autenticação", async () => {
	// 		const dadosAtualizacao = {
	// 			id: 1,
	// 			titulo: "Dom Casmurro - Edição Revisada",
	// 			descricao: "Romance clássico com notas explicativas",
	// 			preco: 49.9,
	// 			desconto: 10.0,
	// 			foto: "dom-casmurro-revisado.jpg",
	// 			paginas: 320,
	// 			idioma: "Português",
	// 			isbn10: "8573261602",
	// 			isbn13: "9788573261600",
	// 			categoria: { id: 1 },
	// 			editora: { id: 1 },
	// 			autores: [{ id: 1 }, { id: 2 }],
	// 		}

	// 		const produtoAtualizado: ProdutoMock = {
	// 			id: 1,
	// 			titulo: dadosAtualizacao.titulo,
	// 			descricao: dadosAtualizacao.descricao,
	// 			preco: dadosAtualizacao.preco,
	// 			desconto: dadosAtualizacao.desconto,
	// 			foto: dadosAtualizacao.foto,
	// 			paginas: dadosAtualizacao.paginas,
	// 			idioma: dadosAtualizacao.idioma,
	// 			isbn10: dadosAtualizacao.isbn10,
	// 			isbn13: dadosAtualizacao.isbn13,
	// 			categoria: mockCategoria,
	// 			editora: mockEditora,
	// 			autores: mockAutores,
	// 		}

	// 		;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue(produtoAtualizado)

	// 		const imageBuffer = Buffer.from([
	// 			0x89,
	// 			0x50,
	// 			0x4e,
	// 			0x47,
	// 			0x0d,
	// 			0x0a,
	// 			0x1a,
	// 			0x0a, // PNG header
	// 		])

	// 		const response = await request(app.getHttpServer())
	// 			.put("/produtos")
	// 			.set("Authorization", `Bearer ${token}`)
	// 			.field("id", dadosAtualizacao.id.toString())
	// 			.field("titulo", dadosAtualizacao.titulo)
	// 			.field("descricao", dadosAtualizacao.descricao)
	// 			.field("preco", dadosAtualizacao.preco.toString())
	// 			.field("desconto", dadosAtualizacao.desconto.toString())
	// 			.field("paginas", dadosAtualizacao.paginas.toString())
	// 			.field("idioma", dadosAtualizacao.idioma)
	// 			.field("isbn10", dadosAtualizacao.isbn10)
	// 			.field("isbn13", dadosAtualizacao.isbn13)
	// 			.field("categoriaId", dadosAtualizacao.categoria.id.toString())
	// 			.field("editoraId", dadosAtualizacao.editora.id.toString())
	// 			.field("autoresIds", dadosAtualizacao.autores.map((a) => a.id).join(","))
	// 			.attach("foto", imageBuffer, {
	// 				filename: "test.png",
	// 				contentType: "image/png",
	// 			})

	// 		if (response.status !== 200) {
	// 			console.log("PUT Response status:", response.status)
	// 			console.log("PUT Response body:", response.body)
	// 		}

	// 		expect(response.status).toBe(200)
	// 		expect(response.body.autores).toHaveLength(2)
	// 		expect(response.body.titulo).toBe("Dom Casmurro - Edição Revisada")
	// 		expect(response.body.preco).toBe(49.9)
	// 	})

	// 	it("deve atualizar produto sem foto", async () => {
	// 		const dadosAtualizacao = {
	// 			id: 1,
	// 			titulo: "Dom Casmurro - Edição Simples",
	// 			descricao: "Romance clássico",
	// 			preco: 35.9,
	// 			desconto: 0,
	// 			foto: "dom-casmurro-simples.jpg",
	// 			paginas: 240,
	// 			idioma: "Português",
	// 			isbn10: "8573261610",
	// 			isbn13: "9788573261617",
	// 			categoria: { id: 1 },
	// 			editora: { id: 1 },
	// 			autores: [{ id: 1 }],
	// 		}

	// 		const produtoAtualizado: ProdutoMock = {
	// 			id: 1,
	// 			titulo: dadosAtualizacao.titulo,
	// 			descricao: dadosAtualizacao.descricao,
	// 			preco: dadosAtualizacao.preco,
	// 			desconto: dadosAtualizacao.desconto,
	// 			foto: dadosAtualizacao.foto,
	// 			paginas: dadosAtualizacao.paginas,
	// 			idioma: dadosAtualizacao.idioma,
	// 			isbn10: dadosAtualizacao.isbn10,
	// 			isbn13: dadosAtualizacao.isbn13,
	// 			categoria: mockCategoria,
	// 			editora: mockEditora,
	// 			autores: [mockAutores[0]],
	// 		}

	// 		;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue(produtoAtualizado)

	// 		const response = await request(app.getHttpServer())
	// 			.put("/produtos")
	// 			.set("Authorization", `Bearer ${token}`)
	// 			.field("id", dadosAtualizacao.id.toString())
	// 			.field("titulo", dadosAtualizacao.titulo)
	// 			.field("descricao", dadosAtualizacao.descricao)
	// 			.field("preco", dadosAtualizacao.preco.toString())
	// 			.field("desconto", dadosAtualizacao.desconto.toString())
	// 			.field("paginas", dadosAtualizacao.paginas.toString())
	// 			.field("idioma", dadosAtualizacao.idioma)
	// 			.field("isbn10", dadosAtualizacao.isbn10)
	// 			.field("isbn13", dadosAtualizacao.isbn13)
	// 			.field("categoriaId", dadosAtualizacao.categoria.id.toString())
	// 			.field("editoraId", dadosAtualizacao.editora.id.toString())
	// 			.field("autoresIds", dadosAtualizacao.autores[0].id.toString())

	// 		if (response.status !== 200) {
	// 			console.log("PUT sem foto Response status:", response.status)
	// 			console.log("PUT sem foto Response body:", response.body)
	// 		}

	// 		expect(response.status).toBe(200)
	// 		expect(response.body.titulo).toBe("Dom Casmurro - Edição Simples")
	// 	})

	// 	it("deve retornar erro 401 sem autenticação", async () => {
	// 		const response = await request(app.getHttpServer())
	// 			.put("/produtos")
	// 			.field("id", "1")
	// 			.field("titulo", "Teste")
	// 			.field("descricao", "Descrição teste")
	// 			.field("preco", "29.90")
	// 			.field("desconto", "0")
	// 			.field("paginas", "100")
	// 			.field("idioma", "Português")
	// 			.field("isbn10", "8573261629")
	// 			.field("isbn13", "9788573261624")
	// 			.field("categoriaId", "1")
	// 			.field("editoraId", "1")
	// 			.field("autoresIds", "1")

	// 		expect(response.status).toBe(401)
	// 	})
	// })

	// describe("Validações de arquivo", () => {
	// 	it("deve aceitar tipos de arquivo válidos (jpg, jpeg, png)", async () => {
	// 		const tiposValidos = [
	// 			{ nome: "test.jpg", contentType: "image/jpeg", header: [0xff, 0xd8, 0xff, 0xe0] },
	// 			{ nome: "test.jpeg", contentType: "image/jpeg", header: [0xff, 0xd8, 0xff, 0xe0] },
	// 			{ nome: "test.png", contentType: "image/png", header: [0x89, 0x50, 0x4e, 0x47] },
	// 		]

	// 		for (const arquivo of tiposValidos) {
	// 			;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue({
	// 				id: 4,
	// 				titulo: "Produto Teste",
	// 				foto: arquivo.nome,
	// 			})

	// 			const imageBuffer = Buffer.from(arquivo.header)

	// 			const response = await request(app.getHttpServer())
	// 				.post("/produtos")
	// 				.set("Authorization", `Bearer ${token}`)
	// 				.field("titulo", "Produto Teste")
	// 				.field("descricao", "Descrição teste")
	// 				.field("preco", "29.90")
	// 				.field("desconto", "0")
	// 				.field("paginas", "100")
	// 				.field("idioma", "Português")
	// 				.field("isbn10", "8573261629")
	// 				.field("isbn13", "9788573261624")
	// 				.field("categoriaId", "1")
	// 				.field("editoraId", "1")
	// 				.field("autoresIds", "1")
	// 				.attach("foto", imageBuffer, {
	// 					filename: arquivo.nome,
	// 					contentType: arquivo.contentType,
	// 				})

	// 			// Deve aceitar (201) ou pode ter outras validações (422)
	// 			expect([200, 201, 422]).toContain(response.status)
	// 			if (response.status === 400) {
	// 				expect(response.body.message).not.toMatch(/tipo.*arquivo|file.*type/i)
	// 			}
	// 		}
	// 	})

	// 	it("deve aceitar webp no update", async () => {
	// 		;(produtoRepositoryMock.save as jest.Mock).mockResolvedValue({
	// 			id: 1,
	// 			titulo: "Produto Teste",
	// 			foto: "test.webp",
	// 		})

	// 		// WebP header
	// 		const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46])

	// 		const response = await request(app.getHttpServer())
	// 			.put("/produtos")
	// 			.set("Authorization", `Bearer ${token}`)
	// 			.field("id", "1")
	// 			.field("titulo", "Produto Teste")
	// 			.field("descricao", "Descrição teste")
	// 			.field("preco", "29.90")
	// 			.field("desconto", "0")
	// 			.field("paginas", "100")
	// 			.field("idioma", "Português")
	// 			.field("isbn10", "8573261629")
	// 			.field("isbn13", "9788573261624")
	// 			.field("categoriaId", "1")
	// 			.field("editoraId", "1")
	// 			.field("autoresIds", "1")
	// 			.attach("foto", webpBuffer, {
	// 				filename: "test.webp",
	// 				contentType: "image/webp",
	// 			})

	// 		expect([200, 201, 422]).toContain(response.status)
	// 	})

	// 	it("deve validar tamanho máximo do arquivo (5MB)", async () => {
	// 		const arquivoGrande = Buffer.alloc(6 * 1024 * 1024, 0xff) // 6MB

	// 		const response = await request(app.getHttpServer())
	// 			.post("/produtos")
	// 			.set("Authorization", `Bearer ${token}`)
	// 			.field("titulo", "Produto Teste")
	// 			.field("descricao", "Descrição teste")
	// 			.field("preco", "29.90")
	// 			.field("desconto", "0")
	// 			.field("paginas", "100")
	// 			.field("idioma", "Português")
	// 			.field("isbn10", "8573261629")
	// 			.field("isbn13", "9788573261624")
	// 			.field("categoriaId", "1")
	// 			.field("editoraId", "1")
	// 			.field("autoresIds", "1")
	// 			.attach("foto", arquivoGrande, {
	// 				filename: "test.jpg",
	// 				contentType: "image/jpeg",
	// 			})

	// 		expect(response.status).toBe(400)
	// 	})
	// })

	// describe("Autenticação", () => {
	// 	it("deve retornar erro 401 com token inválido", async () => {
	// 		const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0])

	// 		const response = await request(app.getHttpServer())
	// 			.post("/produtos")
	// 			.set("Authorization", "Bearer token-invalido")
	// 			.field("titulo", "Teste")
	// 			.field("descricao", "Descrição teste")
	// 			.field("preco", "29.90")
	// 			.field("desconto", "0")
	// 			.field("paginas", "100")
	// 			.field("idioma", "Português")
	// 			.field("isbn10", "8573261629")
	// 			.field("isbn13", "9788573261624")
	// 			.field("categoriaId", "1")
	// 			.field("editoraId", "1")
	// 			.field("autoresIds", "1")
	// 			.attach("foto", imageBuffer, {
	// 				filename: "test.jpg",
	// 				contentType: "image/jpeg",
	// 			})

	// 		expect(response.status).toBe(401)
	// 	})
	// })
})

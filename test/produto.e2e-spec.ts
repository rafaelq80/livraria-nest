// test/produto.e2e-spec.ts
import * as request from "supertest"
import { ProdutoController } from "../src/produto/controllers/produto.controller"
import { Produto } from "../src/produto/entities/produto.entity"
import { ProdutoService } from "../src/produto/services/produto.service"
import { BaseTestHelper } from "./helpers/base-test.helper"
import { ProdutoMockFactory } from "./factories/produto-mock.factory"
import { ProdutoServicesMockFactory } from "./mocks/produto-services.mock"

describe("ProdutoController (e2e)", () => {
  let testHelper: BaseTestHelper
  let mockData: ReturnType<typeof ProdutoMockFactory.createCompleteData>

  beforeEach(async () => {
    testHelper = new BaseTestHelper()
    mockData = ProdutoMockFactory.createCompleteData()
    
    const mockServices = ProdutoServicesMockFactory.create()

    await testHelper.createTestModule({
      controller: ProdutoController,
      service: ProdutoService,
      entity: Produto,
      mockServices,
    })
  })

  afterEach(async () => {
    await testHelper.cleanup()
  })

  describe("GET /produtos", () => {
    it("should return all produtos", async () => {
      testHelper.mockRepo.find.mockResolvedValue([mockData.produto])

      const response = await request(testHelper.httpServer)
        .get("/produtos")
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        id: mockData.produto.id,
        titulo: mockData.produto.titulo,
        preco: mockData.produto.preco,
      })
      expect(testHelper.mockRepo.find).toHaveBeenCalledWith({
        relations: {
          autores: true,
          categoria: true,
          editora: true,
        },
        order: {
          titulo: "ASC",
        },
        cache: true,
      })
    })

    it("should return empty array when no produtos exist", async () => {
      testHelper.mockRepo.find.mockResolvedValue([])

      const response = await request(testHelper.httpServer)
        .get("/produtos")
        .expect(200)

      expect(response.body).toHaveLength(0)
    })
  })

  describe("GET /produtos/:id", () => {
    it("should return produto by id", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(mockData.produto)

      const response = await request(testHelper.httpServer)
        .get("/produtos/1")
        .expect(200)

      expect(response.body).toMatchObject({
        id: mockData.produto.id,
        titulo: mockData.produto.titulo,
        preco: mockData.produto.preco,
      })
      expect(testHelper.mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          autores: true,
          categoria: true,
          editora: true,
        },
      })
    })

    it("should return 404 when produto not found", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(null)

      await request(testHelper.httpServer)
        .get("/produtos/999")
        .expect(404)
    })

    it("should return 400 for invalid id", async () => {
      await request(testHelper.httpServer)
        .get("/produtos/0")
        .expect(400)
    })
  })

  describe("GET /produtos/titulo/:titulo", () => {
    it("should return produtos by titulo", async () => {
      testHelper.mockRepo.find.mockResolvedValue([mockData.produto])

      const response = await request(testHelper.httpServer)
        .get("/produtos/titulo/Dom")
        .set("Authorization", "Bearer mock-token")
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].titulo).toContain("Dom")
      expect(testHelper.mockJwtGuard.canActivate).toHaveBeenCalled()
    })

    it("should return 401 when token is invalid or missing", async () => {
      testHelper.mockAuthUnauthorized("Token inválido")

      await request(testHelper.httpServer)
        .get("/produtos/titulo/Dom")
        .expect(401)
    })

    it("should return 403 when user is authenticated but lacks permission", async () => {
      testHelper.mockAuthForbidden()

      await request(testHelper.httpServer)
        .get("/produtos/titulo/Dom")
        .set("Authorization", "Bearer valid-but-insufficient-token")
        .expect(403)
    })
  })

  describe("POST /produtos", () => {
    const novoProduto = {
      titulo: "Novo Livro",
      descricao: "Descrição do novo livro",
      preco: 39.99,
      desconto: 0,
      categoria: { id: 1 },
      editora: { id: 1 },
      autores: [{ id: 1 }],
    }

    it("should create a new produto", async () => {
      const produtoSalvo = { ...mockData.produto, ...novoProduto }
      testHelper.mockRepo.save.mockResolvedValue(produtoSalvo)
      testHelper.mockRepo.findOne.mockResolvedValue(produtoSalvo)

      const response = await request(testHelper.httpServer)
        .post("/produtos")
        .set("Authorization", "Bearer mock-token")
        .send(novoProduto)
        .expect(201)

      expect(response.body).toMatchObject({
        titulo: novoProduto.titulo,
        preco: novoProduto.preco,
      })
    })

    it("should create produto with image file", async () => {
      const produtoSalvo = { ...mockData.produto, ...novoProduto }
      testHelper.mockRepo.save.mockResolvedValue(produtoSalvo)
      testHelper.mockRepo.findOne.mockResolvedValue(produtoSalvo)

      await request(testHelper.httpServer)
        .post("/produtos")
        .set("Authorization", "Bearer mock-token")
        .field("titulo", novoProduto.titulo)
        .field("preco", novoProduto.preco.toString())
        .field("categoria[id]", "1")
        .field("editora[id]", "1")
        .attach("fotoFile", Buffer.from("fake image"), "test.jpg")
        .expect(201)
    })

    it("should require authentication", async () => {
      testHelper.mockAuthUnauthorized("Token inválido")

      await request(testHelper.httpServer)
        .post("/produtos")
        .send(novoProduto)
        .expect(401)
    })

    it("should validate required fields", async () => {
      await request(testHelper.httpServer)
        .post("/produtos")
        .set("Authorization", "Bearer mock-token")
        .send({})
        .expect(400)
    })
  })

  describe("PUT /produtos", () => {
    const produtoAtualizado = {
      id: 1,
      titulo: "Título Atualizado",
      descricao: "Descrição atualizada",
      preco: 49.99,
      desconto: 15,
      categoria: { id: 1 },
      editora: { id: 1 },
      autores: [{ id: 1 }],
    }

    it("should update existing produto", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(mockData.produto)
      const queryRunner = testHelper.mockRepo.manager.connection.createQueryRunner()
      queryRunner.manager.getRepository().findOne.mockResolvedValue(mockData.produto)

      await request(testHelper.httpServer)
        .put("/produtos")
        .set("Authorization", "Bearer mock-token")
        .send(produtoAtualizado)
        .expect(200)
    })

    it("should require authentication", async () => {
      testHelper.mockAuthUnauthorized("Token inválido")

      await request(testHelper.httpServer)
        .put("/produtos")
        .send(produtoAtualizado)
        .expect(401)
    })

    it("should return 404 when produto not found", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(null)

      await request(testHelper.httpServer)
        .put("/produtos")
        .set("Authorization", "Bearer mock-token")
        .send(produtoAtualizado)
        .expect(404)
    })
  })

  describe("DELETE /produtos/:id", () => {
    it("should delete produto by id", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(mockData.produto)
      testHelper.mockRepo.delete.mockResolvedValue({ affected: 1, raw: {} })

      await request(testHelper.httpServer)
        .delete("/produtos/1")
        .set("Authorization", "Bearer mock-token")
        .expect(204)

      expect(testHelper.mockRepo.delete).toHaveBeenCalledWith(1)
    })

    it("should require authentication", async () => {
      testHelper.mockAuthUnauthorized("Token inválido")

      await request(testHelper.httpServer)
        .delete("/produtos/1")
        .expect(401)
    })

    it("should return 404 when produto not found", async () => {
      testHelper.mockRepo.findOne.mockResolvedValue(null)

      await request(testHelper.httpServer)
        .delete("/produtos/999")
        .set("Authorization", "Bearer mock-token")
        .expect(404)
    })
  })
})
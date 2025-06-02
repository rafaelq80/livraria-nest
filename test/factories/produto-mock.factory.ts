import { Autor } from "../../src/autor/entities/autor.entity"
import { Categoria } from "../../src/categoria/entities/categoria.entity"
import { Editora } from "../../src/editora/entities/editora.entity"
import { Produto } from "../../src/produto/entities/produto.entity"

export interface ProdutoMockData {
  autor: Autor
  categoria: Categoria
  editora: Editora
  produto: Produto
}

export class ProdutoMockFactory {
  static createMockAutor(overrides: Partial<Autor> = {}): Autor {
    return {
      id: 1,
      nome: "Machado de Assis",
      nacionalidade: "Brasileira",
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
      ...overrides,
    }
  }

  static createMockCategoria(overrides: Partial<Categoria> = {}): Categoria {
    return {
      id: 1,
      tipo: "Literatura Brasileira",
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
      ...overrides,
    }
  }

  static createMockEditora(overrides: Partial<Editora> = {}): Editora {
    return {
      id: 1,
      nome: "Companhia das Letras",
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
      ...overrides,
    }
  }

  static createMockProduto(
    autor?: Autor,
    categoria?: Categoria,
    editora?: Editora,
    overrides: Partial<Produto> = {}
  ): Produto {
    const mockAutor = autor || this.createMockAutor()
    const mockCategoria = categoria || this.createMockCategoria()
    const mockEditora = editora || this.createMockEditora()

    return {
      id: 1,
      titulo: "Dom Casmurro",
      descricao: "Clássico da literatura brasileira",
      preco: 29.99,
      desconto: 10,
      foto: "https://example.com/foto.jpg",
      paginas: 200,
      idioma: "Português",
      isbn10: "0306406152",
      isbn13: "9783161484100",
      createdAt: new Date(),
      updatedAt: new Date(),
      autores: [mockAutor],
      categoria: mockCategoria,
      editora: mockEditora,
      get precoComDesconto() {
        return this.preco * (1 - this.desconto / 100)
      },
      get temDesconto() {
        return this.desconto > 0
      },
      ...overrides,
    }
  }

  static createCompleteData(): ProdutoMockData {
    const autor = this.createMockAutor()
    const categoria = this.createMockCategoria()
    const editora = this.createMockEditora()
    const produto = this.createMockProduto(autor, categoria, editora)

    return {
      autor,
      categoria,
      editora,
      produto,
    }
  }
}
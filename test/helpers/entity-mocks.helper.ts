import { AutorMock, CategoriaMock, EditoraMock, ProdutoMock } from './types.helper';

export class EntityMocks {
  // Mock base da Categoria
  static createCategoriaMock(overrides: Partial<CategoriaMock> = {}): CategoriaMock {
    return {
      id: 1,
      tipo: 'Literatura Brasileira',
      produto: [],
      ...overrides
    };
  }

  // Mock base da Editora
  static createEditoraMock(overrides: Partial<EditoraMock> = {}): EditoraMock {
    return {
      id: 1,
      nome: 'Editora Globo',
      produto: [],
      ...overrides
    };
  }

  // Mock base do Autor
  static createAutorMock(overrides: Partial<AutorMock> = {}): AutorMock {
    return {
      id: 1,
      nome: 'Ziraldo',
      nacionalidade: 'Brasileira',
      produtos: [],
      ...overrides
    };
  }

  // Mock base do Produto - Relação N:N
  static createProdutoMock(overrides: Partial<ProdutoMock> = {}): ProdutoMock {
    const defaultCategoria = this.createCategoriaMock();
    const defaultEditora = this.createEditoraMock();
    const defaultAutores = [this.createAutorMock()];

    return {
      id: 1,
      titulo: "Produto",
      descricao: "livro",
      preco: 29.90,
      desconto: 0,
      foto: "",
      paginas: 100,
      idioma: "Português",
      isbn10: "8573261629",
      isbn13: "9788573261624",
      categoria: defaultCategoria,
      editora: defaultEditora,
      autores: defaultAutores, // Array de autores para relação N:N
      ...overrides
    };
  }

  // Factory para criar múltiplos mocks
  static createMultipleCategoriaMocks(
    count: number, 
    baseOverrides: Partial<CategoriaMock> = {}
  ): CategoriaMock[] {
    return Array.from({ length: count }, (_, index) => 
      this.createCategoriaMock({ 
        id: index + 1, 
        tipo: `Categoria ${index + 1}`,
        ...baseOverrides 
      })
    );
  }

  // Factory para criar múltiplos mocks
  static createMultipleEditoraMocks(
    count: number, 
    baseOverrides: Partial<EditoraMock> = {}
  ): EditoraMock[] {
    return Array.from({ length: count }, (_, index) => 
      this.createEditoraMock({ 
        id: index + 1, 
        nome: `Editora ${index + 1}`,
        ...baseOverrides 
      })
    );
  }

  // Factory para criar múltiplos mocks de autor
  static createMultipleAutorMocks(
    count: number, 
    baseOverrides: Partial<AutorMock> = {}
  ): AutorMock[] {
    return Array.from({ length: count }, (_, index) => 
      this.createAutorMock({ 
        id: index + 1, 
        nome: `Autor ${index + 1}`,
        nacionalidade: 'Brasileira',
        ...baseOverrides 
      })
    );
  }

  // Factory para criar múltiplos mocks de produto
  static createMultipleProdutoMocks(
    count: number, 
    baseOverrides: Partial<ProdutoMock> = {}
  ): ProdutoMock[] {
    return Array.from({ length: count }, (_, index) => 
      this.createProdutoMock({ 
        id: index + 1, 
        titulo: `Produto ${index + 1}`,
        descricao: "livro",
        preco: 29.90,
        desconto: 0,
        foto: "",
        paginas: 100,
        idioma: "Português",
        isbn10: "8573261629",
        isbn13: "9788573261624",
        ...baseOverrides 
      })
    );
  }

  // Método auxiliar para criar produto com autores específicos
  static createProdutoWithAutores(
    produtoData: Partial<ProdutoMock>,
    autores: AutorMock[]
  ): ProdutoMock {
    return this.createProdutoMock({
      ...produtoData,
      autores
    });
  }

  // Método auxiliar para criar autor com produtos específicos
  static createAutorWithProdutos(
    autorData: Partial<AutorMock>,
    produtos: ProdutoMock[]
  ): AutorMock {
    return this.createAutorMock({
      ...autorData,
      produtos
    });
  }

  // Método para criar cenário completo de teste com relações N:N
  static createCompleteTestScenario() {
    // Criar autores
    const autor1 = this.createAutorMock({
      id: 1,
      nome: 'Machado de Assis',
      nacionalidade: 'Brasileira'
    });

    const autor2 = this.createAutorMock({
      id: 2,
      nome: 'Clarice Lispector',
      nacionalidade: 'Brasileira'
    });

    // Criar categoria e editora
    const categoria = this.createCategoriaMock({
      id: 1,
      tipo: 'Literatura Clássica'
    });

    const editora = this.createEditoraMock({
      id: 1,
      nome: 'Companhia das Letras'
    });

    // Criar produtos com diferentes combinações de autores
    const produto1 = this.createProdutoMock({
      id: 1,
      titulo: 'Dom Casmurro',
      descricao: 'Romance clássico brasileiro',
      preco: 45.90,
      desconto: 10,
      foto: "dom-casmurro.jpg",
      paginas: 256,
      idioma: "Português",
      isbn10: "8535902775",
      isbn13: "9788535902778",
      categoria,
      editora,
      autores: [autor1] // Produto com um autor
    });

    const produto2 = this.createProdutoMock({
      id: 2,
      titulo: 'Antologia Literária',
      descricao: 'Coletânea de textos clássicos',
      preco: 89.90,
      desconto: 15,
      foto: "antologia-literaria.jpg",
      paginas: 512,
      idioma: "Português",
      isbn10: "8535915245",
      isbn13: "9788535915242",
      categoria,
      editora,
      autores: [autor1, autor2] // Produto com múltiplos autores
    });

    const produto3 = this.createProdutoMock({
      id: 3,
      titulo: 'A Hora da Estrela',
      descricao: 'Romance contemporâneo brasileiro',
      preco: 35.00,
      desconto: 5,
      foto: "hora-da-estrela.jpg",
      paginas: 192,
      idioma: "Português",
      isbn10: "8535926441",
      isbn13: "9788535926446",
      categoria,
      editora,
      autores: [autor2] // Produto com um autor
    });

    // Atualizar a relação inversa nos autores
    autor1.produtos = [produto1, produto2];
    autor2.produtos = [produto2, produto3];

    return {
      autores: [autor1, autor2],
      produtos: [produto1, produto2, produto3],
      categoria,
      editora
    };
  }
}
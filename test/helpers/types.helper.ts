// Tipos compartilhados para testes E2E

export interface MockRepository<T = unknown> {
  find: jest.MockedFunction<() => Promise<T[]>>;
  findOne: jest.MockedFunction<() => Promise<T | null>>;
  save: jest.MockedFunction<(entity: Partial<T>) => Promise<T>>;
  delete: jest.MockedFunction<(id: number | string) => Promise<{ affected: number }>>;
  create: jest.MockedFunction<(entity: Partial<T>) => T>;
  update: jest.MockedFunction<(id: number | string, entity: Partial<T>) => Promise<{ affected: number }>>;
  remove: jest.MockedFunction<(entity: T) => Promise<T>>;
}

export interface EntityConstructor {
  new (...args: unknown[]): unknown;
}

export interface CommonMocks {
  jwtAuthGuard: {
    canActivate: jest.MockedFunction<() => boolean>;
  };
  sendmailService: {
    enviarEmailConfirmacao: jest.MockedFunction<() => Promise<void>>;
  };
}

export interface TestConfigOptions {
  entities: EntityConstructor[];
  repositoryMocks: Record<string, MockRepository>;
  additionalMocks?: Record<string, Record<string, unknown>>;
}

// Tipos específicos das entidades baseados nos mocks
export type CategoriaMock = {
  id: number;
  tipo: string;
  produto: unknown[];
};

export type EditoraMock = {
  id: number;
  nome: string;
  produto: unknown[];
};

export type AutorMock = {
  id: number;
  nome: string;
  nacionalidade: string
  produtos: ProdutoMock[];
};

export type ProdutoMock = {
  id: number;
  titulo: string;
  descricao?: string;
  preco: number;
  desconto: number;
  foto?: string;
  paginas?: number;
  idioma?: string;
  isbn10: string;
  isbn13: string;
  categoria: CategoriaMock;
  editora: EditoraMock;
  autores: AutorMock[];
};

// DTOs para requisições
export interface CreateProdutoDto {
  titulo: string;
  descricao?: string;
  preco: number;
  desconto: number;
  foto?: string;
  paginas?: number;
  idioma?: string;
  isbn10: string;
  isbn13: string;
  categoriaId: number;
  editoraId: number;
  autoresIds: number[]; // Array de IDs dos autores
}

export interface UpdateProdutoDto {
  id: number;
  titulo: string;
  descricao?: string;
  preco: number;
  desconto: number;
  foto?: string;
  paginas?: number;
  idioma?: string;
  isbn10: string;
  isbn13: string;
  categoriaId?: number;
  editoraId?: number;
  autoresIds?: number[]; // Array de IDs dos autores
}
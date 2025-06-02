import { FindManyOptions, FindOneOptions } from "typeorm";

// Tipos compartilhados para testes E2E

export interface ImageKitServiceMock {
  handleImage: jest.MockedFunction<(file: Express.Multer.File) => Promise<string>>;
  uploadImage: jest.MockedFunction<(buffer: Buffer, fileName: string) => Promise<ImageKitUploadResponse>>;
  processImage: jest.MockedFunction<(buffer: Buffer, maxWidth?: number, quality?: number) => Promise<Buffer>>;
  deleteImage: jest.MockedFunction<(fileId: string) => Promise<boolean>>;
  updateImage?: jest.MockedFunction<(fileId: string, buffer: Buffer) => Promise<string>>;
}

export interface ImageKitUploadResponse {
  url: string;
  fileId: string;
  name: string;
  size?: number;
  filePath?: string;
}

export interface MockRepository<T = unknown> {
  find: jest.MockedFunction<(options?: FindManyOptions<T>) => Promise<T[]>>;
  findOne: jest.MockedFunction<(options?: FindOneOptions<T>) => Promise<T | null>>;
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
  imageKitService: ImageKitServiceMock;
}

export interface TestConfigOptions {
  entities: EntityConstructor[];
  repositoryMocks: Record<string, MockRepository>;
  additionalMocks?: Record<string, Record<string, unknown>>;
}

// Tipos específicos das entidades baseados nos mocks
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
  createdAt: Date;
  updatedAt: Date;
  categoria: CategoriaMock;
  editora: EditoraMock;
  autores: AutorMock[];
  precoComDesconto(): number;
  temDesconto(): boolean;
};

export type CategoriaMock = {
  id: number;
  tipo: string;
  createdAt: Date;
  updatedAt: Date;
  produtos: ProdutoMock[];
};

export type EditoraMock = {
  id: number;
  nome: string;
  createdAt: Date;
  updatedAt: Date;
  produtos: ProdutoMock[];
};

export type AutorMock = {
  id: number;
  nome: string;
  nacionalidade: string;
  createdAt: Date;
  updatedAt: Date;
  produtos: ProdutoMock[];
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
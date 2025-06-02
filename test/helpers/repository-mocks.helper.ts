import { EntityMocks } from "./entity-mocks.helper"
import { AutorMock, CategoriaMock, EditoraMock, MockRepository } from "./types.helper"

export class RepositoryMocks {
	// Criar mock genérico de repositório
	static createRepositoryMock<T = unknown>(mockData: T | T[]): MockRepository<T> {
		const data = Array.isArray(mockData) ? mockData : [mockData]

		return {
			find: jest.fn().mockResolvedValue(data),
			findOne: jest.fn().mockResolvedValue(data[0] || null),
			save: jest
				.fn()
				.mockImplementation((entity: Partial<T>) =>
					Promise.resolve({ id: expect.any(Number), ...entity } as T),
				),
			delete: jest.fn().mockResolvedValue({ affected: 1 }),
			create: jest.fn().mockImplementation((entity: Partial<T>) => ({ ...entity }) as T),
			update: jest.fn().mockResolvedValue({ affected: 1 }),
			remove: jest.fn().mockImplementation((entity: T) => Promise.resolve(entity)),
		}
	}

	// Mock específico para Categoria
	static createCategoriaRepositoryMock(
		categorias: CategoriaMock[] = [EntityMocks.createCategoriaMock()],
	): MockRepository<CategoriaMock> {
		return this.createRepositoryMock(categorias)
	}

	// Mock específico para Editora
	static createEditoraRepositoryMock(
		editoras: EditoraMock[] = [EntityMocks.createEditoraMock()],
	): MockRepository<EditoraMock> {
		return this.createRepositoryMock(editoras)
	}

	// Mock específico para Editora
	static createAutorRepositoryMock(
		autores: AutorMock[] = [EntityMocks.createAutorMock()],
	): MockRepository<AutorMock> {
		return this.createRepositoryMock(autores)
	}

}

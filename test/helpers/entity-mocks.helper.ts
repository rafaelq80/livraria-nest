import { AutorMock, CategoriaMock, EditoraMock } from './types.helper';

export class EntityMocks {
  // Mock base da Categoria
  static createCategoriaMock(overrides: Partial<CategoriaMock> = {}): CategoriaMock {
    return {
      id: 1,
      tipo: 'Literatura Brasileira',
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
      ...overrides
    };
  }

  // Mock base da Editora
  static createEditoraMock(overrides: Partial<EditoraMock> = {}): EditoraMock {
    return {
      id: 1,
      nome: 'Editora Globo',
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
      ...overrides
    };
  }

  // Mock base do Autor
  static createAutorMock(overrides: Partial<AutorMock> = {}): AutorMock {
    return {
      id: 1,
      nome: 'Ziraldo',
      nacionalidade: 'Brasileira',
      createdAt: new Date(),
      updatedAt: new Date(),
      produtos: [],
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

}
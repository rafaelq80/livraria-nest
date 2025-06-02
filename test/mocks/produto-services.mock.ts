// test/mocks/produto-services.mock.ts
import { AutorService } from "../../src/autor/services/autor.service"
import { CategoriaService } from "../../src/categoria/services/categoria.service"
import { EditoraService } from "../../src/editora/services/editora.service"
import { ImageKitService } from "../../src/imagekit/services/imagekit.service"
import { ProdutoMockFactory } from "../factories/produto-mock.factory"

export class ProdutoServicesMockFactory {
  static create(): Array<{ provide: any; useValue: any }> {
    const mockData = ProdutoMockFactory.createCompleteData()

    return [
      {
        provide: AutorService,
        useValue: {
          processarAutores: jest.fn().mockResolvedValue([mockData.autor]),
        },
      },
      {
        provide: CategoriaService,
        useValue: {
          findById: jest.fn().mockResolvedValue(mockData.categoria),
        },
      },
      {
        provide: EditoraService,
        useValue: {
          findById: jest.fn().mockResolvedValue(mockData.editora),
        },
      },
      {
        provide: ImageKitService,
        useValue: {
          handleImage: jest.fn().mockResolvedValue("https://imagekit.io/uploaded-image.jpg"),
        },
      },
    ]
  }
}
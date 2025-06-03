import { Provider } from "@nestjs/common"
import { Autor } from "../../src/autor/entities/autor.entity"
import { AutorService } from "../../src/autor/services/autor.service"
import { Categoria } from "../../src/categoria/entities/categoria.entity"
import { CategoriaService } from "../../src/categoria/services/categoria.service"
import { Editora } from "../../src/editora/entities/editora.entity"
import { EditoraService } from "../../src/editora/services/editora.service"
import { ImageKitService } from "../../src/imagekit/services/imagekit.service"
import { ProdutoMockFactory } from "../factories/produto-mock.factory"

interface MockAutorService extends Record<string, jest.Mock> {
	processarAutores: jest.Mock<Promise<Autor[]>, unknown[]>
}

interface MockCategoriaService extends Record<string, jest.Mock> {
	findById: jest.Mock<Promise<Categoria>, unknown[]>
}

interface MockEditoraService extends Record<string, jest.Mock> {
	findById: jest.Mock<Promise<Editora>, unknown[]>
}

interface MockImageKitService extends Record<string, jest.Mock> {
	handleImage: jest.Mock<Promise<string>, unknown[]>
}

export class ProdutoServicesMockFactory {
	static create(): Provider[] {
		const mockData = ProdutoMockFactory.createCompleteData()

		return [
			{
				provide: AutorService,
				useValue: {
					processarAutores: jest
						.fn<Promise<Autor[]>, unknown[]>()
						.mockResolvedValue([mockData.autor]),
				} as MockAutorService,
			},
			{
				provide: CategoriaService,
				useValue: {
					findById: jest
						.fn<Promise<Categoria>, unknown[]>()
						.mockResolvedValue(mockData.categoria),
				} as MockCategoriaService,
			},
			{
				provide: EditoraService,
				useValue: {
					findById: jest
						.fn<Promise<Editora>, unknown[]>()
						.mockResolvedValue(mockData.editora),
				} as MockEditoraService,
			},
			{
				provide: ImageKitService,
				useValue: {
					handleImage: jest
						.fn<Promise<string>, unknown[]>()
						.mockResolvedValue("https://imagekit.io/uploaded-image.jpg"),
				} as MockImageKitService,
			},
		]
	}
}

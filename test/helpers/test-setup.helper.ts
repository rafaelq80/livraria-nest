import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import { getRepositoryToken } from "@nestjs/typeorm"
import { JwtService } from "@nestjs/jwt"
import { AppModule } from "../../src/app.module"
import { JwtAuthGuard } from "../../src/security/guards/jwt-auth.guard"
import { SendmailService } from "../../src/sendmail/services/sendmail.service"
import { CommonMocks, TestConfigOptions } from "./types.helper"
import { TestHelpers } from "./test-helpers.helper"
import { ImageKitService } from "../../src/imagekit/services/imagekit.service"

export class E2ETestSetup {
	private app!: INestApplication
	private jwtService!: JwtService
	private token!: string

	// Mocks comuns reutilizáveis
	static createCommonMocks(): CommonMocks {
		return {
			jwtAuthGuard: {
				canActivate: jest.fn().mockImplementation(() => true),
			},
			sendmailService: {
				enviarEmailConfirmacao: jest.fn().mockResolvedValue(undefined),
			},
			imageKitService: TestHelpers.createImageKitServiceMock(),
		}
	}

	// Configuração base do módulo de teste
	async setupTestModule(config: TestConfigOptions): Promise<void> {
		const commonMocks = E2ETestSetup.createCommonMocks()

		const moduleBuilder = Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue(commonMocks.jwtAuthGuard)
			.overrideProvider(SendmailService)
			.useValue(commonMocks.sendmailService)
			// ADICIONAR: Mock do ImageKitService
			.overrideProvider(ImageKitService)
			.useValue(commonMocks.imageKitService)

		// Configurar mocks dos repositórios
		for (const [entityName, mock] of Object.entries(config.repositoryMocks)) {
			const entity = config.entities.find((e) => e.name === entityName)
			if (entity) {
				moduleBuilder.overrideProvider(getRepositoryToken(entity)).useValue(mock)
			}
		}

		// Configurar mocks adicionais se fornecidos
		if (config.additionalMocks) {
			for (const [provider, mock] of Object.entries(config.additionalMocks)) {
				moduleBuilder.overrideProvider(provider).useValue(mock)
			}
		}

		const moduleFixture: TestingModule = await moduleBuilder.compile()

		this.app = moduleFixture.createNestApplication()
		this.app.useGlobalPipes(new ValidationPipe())

		// Configurar JWT
		this.jwtService = moduleFixture.get<JwtService>(JwtService)
		this.token = this.jwtService.sign({ sub: "usuario@email.com.br" })

		await this.app.init()
	}

	// Método para obter o mock do ImageKitService se necessário para testes específicos
	getImageKitServiceMock() {
		return TestHelpers.createImageKitServiceMock()
	}

	getApp(): INestApplication {
		return this.app
	}

	getToken(): string {
		return this.token
	}

	async closeApp(): Promise<void> {
		await this.app.close()
	}

	// Método utilitário para limpar mocks
	static clearAllMocks(): void {
		jest.clearAllMocks()
	}
}

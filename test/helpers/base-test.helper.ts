// test/helpers/base-test.helper.ts
import { ExecutionContext, INestApplication, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { JwtAuthGuard } from "../../src/security/guards/jwt-auth.guard"

export interface MockRepository {
	find: jest.Mock
	findOne: jest.Mock
	save: jest.Mock
	update: jest.Mock
	delete: jest.Mock
	manager: {
		connection: {
			createQueryRunner: jest.Mock
		}
	}
}

export interface TestModuleConfig {
  controller: any
  service: any
  entity: any
  mockServices?: Record<string, any> | Array<{ provide: any; useValue: any }>
  additionalProviders?: Array<{
    provide: any
    useValue: any
  }>
}

export class BaseTestHelper {
	private app: INestApplication
	private repository: any
	private jwtService: JwtService
	private mockRepository: MockRepository
	private mockJwtAuthGuard: { canActivate: jest.Mock }
	private canActivateMock: jest.Mock

	constructor() {
		this.setupMocks()
	}

	private setupMocks(): void {
		this.mockRepository = this.createMockRepository()
		this.canActivateMock = jest.fn()
		this.mockJwtAuthGuard = {
			canActivate: this.canActivateMock,
		}
	}

	private createMockRepository(): MockRepository {
		return {
			find: jest.fn(),
			findOne: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			manager: {
				connection: {
					createQueryRunner: jest.fn(() => ({
						connect: jest.fn(),
						startTransaction: jest.fn(),
						commitTransaction: jest.fn(),
						rollbackTransaction: jest.fn(),
						release: jest.fn(),
						manager: {
							update: jest.fn(),
							getRepository: jest.fn(() => ({
								findOne: jest.fn(),
								save: jest.fn(),
							})),
						},
					})),
				},
			},
		}
	}

	private createMockJwtService(): { sign: jest.Mock; verify: jest.Mock } {
		return {
			sign: jest.fn().mockReturnValue("mock-jwt-token"),
			verify: jest.fn().mockReturnValue({ sub: 1, username: "testuser" }),
		}
	}

	async createTestModule(config: TestModuleConfig): Promise<void> {
		const providers = [
			config.service,
			{
				provide: getRepositoryToken(config.entity),
				useValue: this.mockRepository,
			},
			{
				provide: JwtService,
				useValue: this.createMockJwtService(),
			},
		]

		// Add mock services if provided
		if (config.mockServices) {
			if (Array.isArray(config.mockServices)) {
				// If mockServices is an array of provider objects
				providers.push(...config.mockServices)
			} else {
				// If mockServices is a Record (the old way)
				Object.entries(config.mockServices).forEach(([serviceName, mockService]) => {
					providers.push({
						provide: serviceName,
						useValue: mockService,
					})
				})
			}
		}

		// Add additional providers if provided
		if (config.additionalProviders) {
			providers.push(...config.additionalProviders)
		}

		const module: TestingModule = await Test.createTestingModule({
			controllers: [config.controller],
			providers,
		})
			.overrideGuard(JwtAuthGuard)
			.useValue(this.mockJwtAuthGuard)
			.compile()

		this.app = module.createNestApplication()
		this.app.useLogger(false)
		await this.app.init()

		this.mockAuthSuccess()

		this.repository = module.get(getRepositoryToken(config.entity))
		this.jwtService = module.get<JwtService>(JwtService)
	}

	// Métodos de configuração de autenticação
	mockAuthSuccess(): void {
		this.canActivateMock.mockImplementation((context: ExecutionContext) => {
			const req = context.switchToHttp().getRequest()
			req.user = { userId: 1, username: "admin" }
			return true
		})
	}

	mockAuthUnauthorized(message = "Token inválido ou ausente"): void {
		this.canActivateMock.mockImplementation(() => {
			throw new UnauthorizedException(message)
		})
	}

	mockAuthForbidden(): void {
		this.canActivateMock.mockImplementation(() => {
			return false
		})
	}

	// Getters
	get httpServer() {
		return this.app.getHttpServer()
	}

	get mockRepo(): MockRepository {
		return this.mockRepository
	}

	get mockJwtGuard(): { canActivate: jest.Mock } {
		return this.mockJwtAuthGuard
	}

	// Cleanup
	async cleanup(): Promise<void> {
		if (this.app) {
			await this.app.close()
		}
		jest.clearAllMocks()
	}
}

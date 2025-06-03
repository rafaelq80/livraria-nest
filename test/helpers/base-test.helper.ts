// test/helpers/base-test.helper.ts
import { ExecutionContext, INestApplication, UnauthorizedException, Provider } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { JwtAuthGuard } from "../../src/security/guards/jwt-auth.guard"

// Tipos específicos para o repositório mock
export interface MockQueryRunner {
  connect: jest.Mock
  startTransaction: jest.Mock
  commitTransaction: jest.Mock
  rollbackTransaction: jest.Mock
  release: jest.Mock
  manager: {
    update: jest.Mock
    getRepository: jest.Mock
  }
}

export interface MockRepository<T = unknown> {
  find: jest.Mock<Promise<T[]>, unknown[]>
  findOne: jest.Mock<Promise<T | null>, unknown[]>
  save: jest.Mock<Promise<T>, [T]>
  update: jest.Mock<Promise<{ affected?: number; raw: unknown }>, unknown[]>
  delete: jest.Mock<Promise<{ affected?: number; raw: unknown }>, unknown[]>
  manager: {
    connection: {
      createQueryRunner: jest.Mock<MockQueryRunner, []>
    }
  }
  [key: string]: jest.Mock | Record<string, unknown>
}

export interface MockJwtService extends Record<string, jest.Mock> {
  sign: jest.Mock<string, unknown[]>
  verify: jest.Mock<{ sub: number; username: string }, unknown[]>
}

export interface TestModuleConfig<TController, TService, TEntity> {
  controller: new (...args: unknown[]) => TController
  service: new (...args: unknown[]) => TService
  entity: new (...args: unknown[]) => TEntity
  mockServices?: Record<string, Record<string, jest.Mock>> | Provider[]
  additionalProviders?: Provider[]
}

export interface MockJwtAuthGuard {
  canActivate: jest.Mock<boolean | Promise<boolean>, [ExecutionContext]>
}

export class BaseTestHelper {
  private app!: INestApplication
  private repository!: MockRepository
  private jwtService!: JwtService
  private mockRepository: MockRepository
  private mockJwtAuthGuard: MockJwtAuthGuard
  private canActivateMock: jest.Mock<boolean | Promise<boolean>, [ExecutionContext]>

  constructor() {
    this.setupMocks()
  }

  private setupMocks(): void {
    this.mockRepository = this.createMockRepository()
    this.canActivateMock = jest.fn<boolean | Promise<boolean>, [ExecutionContext]>()
    this.mockJwtAuthGuard = {
      canActivate: this.canActivateMock,
    }
  }

  private createMockRepository(): MockRepository {
    return {
      find: jest.fn<Promise<unknown[]>, unknown[]>(),
      findOne: jest.fn<Promise<unknown | null>, unknown[]>(),
      save: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<{ affected?: number; raw: unknown }>, unknown[]>(),
      delete: jest.fn<Promise<{ affected?: number; raw: unknown }>, unknown[]>(),
      manager: {
        connection: {
          createQueryRunner: jest.fn<MockQueryRunner, []>(() => ({
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

  private createMockJwtService(): MockJwtService {
    return {
      sign: jest.fn<string, unknown[]>().mockReturnValue("mock-jwt-token"),
      verify: jest.fn<{ sub: number; username: string }, unknown[]>().mockReturnValue({ sub: 1, username: "testuser" }),
    }
  }

  async createTestModule<TController, TService, TEntity>(config: TestModuleConfig<TController, TService, TEntity>): Promise<void> {
    const providers: Provider[] = [
      {
        provide: config.service,
        useValue: {},
      },
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

  // Getters - Mudança principal aqui
  get httpServer() {
    return this.app.getHttpServer()
  }

  get mockRepo(): MockRepository {
    return this.mockRepository
  }

  get mockJwtGuard(): MockJwtAuthGuard {
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
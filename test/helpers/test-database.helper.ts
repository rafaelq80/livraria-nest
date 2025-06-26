import { DynamicModule, INestApplication, Type, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule } from "@nestjs/config"
import { JwtAuthGuard } from "../../src/security/guards/jwt-auth.guard"
import { RolesAuthGuard } from "../../src/security/guards/roles-auth.guard"
import { ImageKitService } from "../../src/imagekit/services/imagekit.service"
import { SendmailService } from "../../src/sendmail/services/sendmail.service"

// Importações dos arquivos separados
import { testConfig, TestConfigOverrides } from "./test-config"
import { mockImageKitService, mockSendmailService, mockAuthGuards } from "./test-mocks"
import { createTestTypeOrmConfig, TestTypeOrmConfigOptions } from "./test-entities"

/**
 * Helper para criação e gerenciamento de módulos de teste E2E
 * 
 * Responsabilidades:
 * - Criar aplicação NestJS para testes
 * - Configurar banco de dados SQLite em memória
 * - Aplicar mocks de serviços externos
 * - Gerenciar ciclo de vida da aplicação
 */
export class TestDatabaseHelper {
    private app!: INestApplication

    /**
     * Cria um módulo de teste com configurações customizáveis
     */
    async createTestModule(
        modules: (Type<unknown> | DynamicModule)[],
        configOverrides: TestConfigOverrides = {},
        typeOrmOptions: TestTypeOrmConfigOptions = {}
    ): Promise<INestApplication> {
        // Mescla configurações padrão com customizações
        const mergedConfig = this.mergeConfigurations(testConfig(), configOverrides)
        const typeOrmConfig = createTestTypeOrmConfig(typeOrmOptions)

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => mergedConfig],
                }),
                TypeOrmModule.forRoot(typeOrmConfig),
                ...modules,
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockAuthGuards)
        .overrideGuard(RolesAuthGuard)
        .useValue(mockAuthGuards)
        .overrideProvider(ImageKitService)
        .useValue(mockImageKitService)
        .overrideProvider(SendmailService)
        .useValue(mockSendmailService)
        .compile()

        this.app = moduleFixture.createNestApplication()

        // Configuração global de validação
        this.app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: {
                    enableImplicitConversion: true,
                },
            })
        )

        await this.app.init()
        return this.app
    }

    /**
     * Fecha a aplicação de teste de forma segura
     * Limpa recursos e zera referências para evitar vazamentos de memória
     */
    async cleanup(): Promise<void> {
        if (this.app) {
            await this.app.close()
            this.app = undefined!
        }
    }

    /**
     * Mescla configurações padrão com customizações
     * Implementa merge profundo para objetos aninhados
     */
    private mergeConfigurations(
        baseConfig: Record<string, unknown>, 
        overrides: TestConfigOverrides
    ): Record<string, unknown> {
        const merged = { ...baseConfig }

        Object.keys(overrides).forEach((key) => {
            if (overrides[key] && typeof overrides[key] === 'object') {
                merged[key] = {
                    ...(merged[key] as Record<string, unknown>),
                    ...(overrides[key] as Record<string, unknown>),
                }
            }
        })

        return merged
    }

    /**
     * Obtém a instância da aplicação atual
     * Útil para acessar a aplicação em testes específicos
     */
    getApp(): INestApplication | undefined {
        return this.app
    }

    /**
     * Verifica se a aplicação está ativa
     */
    isAppActive(): boolean {
        return !!this.app
    }
} 
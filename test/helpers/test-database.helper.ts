import { DynamicModule, INestApplication, Type, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm"
import { Autor } from "../../src/autor/entities/autor.entity"
import { Categoria } from "../../src/categoria/entities/categoria.entity"
import { Editora } from "../../src/editora/entities/editora.entity"
import { Produto } from "../../src/produto/entities/produto.entity"
import { Role } from "../../src/role/entities/role.entity"
import { Usuario } from "../../src/usuario/entities/usuario.entity"
import { JwtAuthGuard } from "../../src/security/guards/jwt-auth.guard"
import { ConfigModule } from "@nestjs/config"
import { ImageKitService } from "../../src/imagekit/services/imagekit.service"
import { SendmailService } from "../../src/sendmail/services/sendmail.service"

export class TestDatabaseHelper {
    private app!: INestApplication

    async createTestModule(modules: (Type<unknown> | DynamicModule)[]): Promise<INestApplication> {
        const typeOrmConfig: TypeOrmModuleOptions = {
            type: "sqlite",
            database: ":memory:",
            entities: [Usuario, Produto, Categoria, Autor, Editora, Role],
            synchronize: true,
            dropSchema: true
        }

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({
                        IMAGEKIT_URL_ENDPOINT: 'https://test.imagekit.io/your-test-endpoint',
                        IMAGEKIT_PRIVATE_KEY: 'test-private-key',
                    })],
                }),
                TypeOrmModule.forRoot(typeOrmConfig),
                ...modules
            ]
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideProvider(ImageKitService)
        .useValue({
            processarUsuarioImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
            processarEditoraImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
            processarProdutoImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
        })
        .overrideProvider(SendmailService)
        .useValue({
            sendmailConfirmacaoLegacy: jest.fn().mockResolvedValue(undefined),
            sendmailRecuperarSenhaLegacy: jest.fn().mockResolvedValue(undefined),
            sendMail: jest.fn().mockResolvedValue(undefined),
        })
        .compile()

        this.app = moduleFixture.createNestApplication()

        this.app.useGlobalPipes(
            new ValidationPipe({
              whitelist: true,
              forbidNonWhitelisted: true,
              transform: true,
              transformOptions: {
                enableImplicitConversion: true,
              },
            })
          );

        await this.app.init()

        return this.app
    }

    async cleanup(): Promise<void> {
        if (this.app) {
            await this.app.close()
        }
    }
} 
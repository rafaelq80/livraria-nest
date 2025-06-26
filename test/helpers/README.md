# Helpers de Teste E2E

Esta pasta contém todos os helpers e utilitários necessários para executar testes E2E de forma organizada e reutilizável.

## Estrutura de Arquivos

### 📁 `test-database.helper.ts`
**Classe principal** para criação e gerenciamento de módulos de teste.
- Cria aplicação NestJS para testes
- Configura banco SQLite em memória
- Aplica mocks de serviços externos
- Gerencia ciclo de vida da aplicação

### 📁 `test-config.ts`
**Configurações centralizadas** para ambiente de teste.
- Configurações JWT, Auth, Google OAuth
- Configurações de email e ImageKit
- Configurações gerais da aplicação
- Interface para customizações

### 📁 `test-mocks.ts`
**Mocks de serviços externos** para isolamento de testes.
- Mock do ImageKitService
- Mock do SendmailService
- Mock dos Guards de autenticação
- Função para limpar mocks

### 📁 `test-entities.ts`
**Configuração de entidades** para TypeORM.
- Lista padrão de entidades
- Configuração do TypeORM para testes
- Opções customizáveis

### 📁 `payloads.ts`
**Payloads e helpers** para criação de dados de teste.
- Funções para criar payloads de entidades
- Helpers para criar dados no banco
- Funções utilitárias

### 📁 `index.ts`
**Arquivo de índice** para facilitar importações.
- Exporta todos os helpers principais
- Centraliza importações

## Como Usar

### Importação Básica
```typescript
import { TestDatabaseHelper } from "./helpers";

const testHelper = new TestDatabaseHelper();
const app = await testHelper.createTestModule([MeuModule]);
```

### Com Configurações Customizadas
```typescript
import { TestDatabaseHelper } from "./helpers";

const testHelper = new TestDatabaseHelper();
const app = await testHelper.createTestModule(
  [MeuModule],
  {
    jwt: { expiration: '30m' },
    app: { environment: 'test-custom' }
  },
  {
    logging: true,
    dropSchema: false
  }
);
```

### Usando Mocks Específicos
```typescript
import { mockImageKitService, clearAllMocks } from "./helpers";

// Limpar mocks entre testes
beforeEach(() => {
  clearAllMocks();
});

// Verificar se mock foi chamado
expect(mockImageKitService.processarUsuarioImage).toHaveBeenCalled();
```

### Configurações Customizadas
```typescript
import { testConfig, TestConfigOverrides } from "./helpers";

const customConfig: TestConfigOverrides = {
  jwt: {
    secret: 'custom-secret',
    expiration: '1h'
  },
  mail: {
    host: 'custom-smtp.com'
  }
};
```

## Benefícios da Nova Estrutura

### ✅ **Separação de Responsabilidades**
- Cada arquivo tem uma responsabilidade específica
- Fácil manutenção e extensão
- Código mais organizado

### ✅ **Reutilização**
- Configurações e mocks centralizados
- Fácil importação via arquivo de índice
- Redução de duplicação de código

### ✅ **Customização**
- Configurações flexíveis via parâmetros
- Overrides para cenários específicos
- TypeScript com tipagem forte

### ✅ **Manutenibilidade**
- Documentação JSDoc completa
- Estrutura clara e consistente
- Fácil de entender e modificar

### ✅ **Isolamento**
- Mocks completos para serviços externos
- Banco de dados isolado por teste
- Sem dependências externas

## Exemplos de Uso Avançado

### Teste com Configuração Específica
```typescript
describe("Teste com configuração customizada", () => {
  let app: INestApplication;
  let testHelper: TestDatabaseHelper;

  beforeAll(async () => {
    testHelper = new TestDatabaseHelper();
    app = await testHelper.createTestModule(
      [MeuModule],
      {
        jwt: { expiration: '5m' },
        auth: { maxLoginAttempts: 3 }
      }
    );
  });

  afterAll(async () => {
    await testHelper.cleanup();
  });
});
```

### Verificação de Mocks
```typescript
it("deve enviar email de confirmação", async () => {
  // ... teste ...
  
  expect(mockSendmailService.sendmailConfirmacaoLegacy)
    .toHaveBeenCalledWith(expect.any(String), expect.any(String));
});
```

### Configuração de TypeORM Customizada
```typescript
const app = await testHelper.createTestModule(
  [MeuModule],
  {},
  {
    logging: true, // Habilita logs SQL
    dropSchema: false, // Não dropa schema
    extraEntities: [NovaEntidade] // Adiciona entidades extras
  }
);
``` 
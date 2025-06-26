/**
 * Arquivo de índice para helpers de teste E2E
 * Centraliza todas as exportações dos helpers para facilitar importações
 */

// Helper principal
export { TestDatabaseHelper } from './test-database.helper';

// Configurações
export { testConfig, TestConfigOverrides } from './test-config';

// Mocks
export { 
  mockImageKitService, 
  mockSendmailService, 
  mockAuthGuards, 
  clearAllMocks 
} from './test-mocks';

// Entidades e configuração do TypeORM
export { 
  defaultTestEntities, 
  getTestTypeOrmConfig, 
  createTestTypeOrmConfig, 
  TestTypeOrmConfigOptions 
} from './test-entities';

// Payloads (já existente)
export * from './payloads';

// Generators
export { gerarISBN10, gerarISBN13 } from './generators'; 
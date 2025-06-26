/**
 * Configurações de teste para o ambiente de testes E2E
 * Centraliza todas as configurações mockadas necessárias para os testes
 */

export const testConfig = () => ({
  // Configurações JWT para testes (estrutura aninhada)
  jwt: {
    secret: 'test-jwt-secret-key-for-testing-only',
    expiration: '1h',
    refreshExpiration: '7d',
    algorithm: 'HS256',
  },
  
  // Configurações de autenticação
  auth: {
    usernameField: 'usuario',
    passwordField: 'senha',
    bcryptSaltRounds: 10,
    sessionEnabled: false,
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 min
  },
  
  // Configurações do Google OAuth
  google: {
    clientId: 'test-google-client-id',
    clientSecret: 'test-google-client-secret',
    callbackURL: 'http://localhost:4000/auth/google/callback',
  },
  
  // Configurações de email
  mail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'test-password',
    },
    from: 'test@example.com',
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: {
      rejectUnauthorized: false
    }
  },
  
  // Configurações ImageKit
  imagekit: {
    privateKey: 'test-private-key',
    urlEndpoint: 'https://test.imagekit.io/your-test-endpoint',
    urlDelete: 'https://api.imagekit.io/v1/files/',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    compressionQuality: 0.8,
    minWidth: 100,
    maxWidth: 4000,
    minHeight: 100,
    maxHeight: 4000,
    maxAspectRatio: 10.0,
    minAspectRatio: 0.1,
    uploadTimeout: 30000, // 30s
    deleteTimeout: 10000, // 10s
    cacheTtl: 5 * 60 * 1000, // 5 minutos
    cacheMaxSize: 1000,
    cacheCleanupInterval: 60 * 1000, // 1 minuto
  },
  
  // Configurações gerais
  port: 4000,
  app: {
    timezone: 'America/Sao_Paulo',
    environment: 'test',
  },
  
  // Configurações CORS
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  
  // Configurações Swagger
  swagger: {
    title: 'Projeto Livraria - Test',
    description: 'Projeto Livraria - Test Environment',
    version: '1.0',
    contact: {
      name: 'Rafael Queiróz',
      url: 'https://github.com/rafaelq80',
      email: 'rafaelproinfo@gmail.com',
    },
    path: '/swagger',
  },
});

/**
 * Tipo para configurações customizadas de teste
 */
export interface TestConfigOverrides {
  jwt?: Partial<ReturnType<typeof testConfig>['jwt']>;
  auth?: Partial<ReturnType<typeof testConfig>['auth']>;
  google?: Partial<ReturnType<typeof testConfig>['google']>;
  mail?: Partial<ReturnType<typeof testConfig>['mail']>;
  imagekit?: Partial<ReturnType<typeof testConfig>['imagekit']>;
  app?: Partial<ReturnType<typeof testConfig>['app']>;
  cors?: Partial<ReturnType<typeof testConfig>['cors']>;
  swagger?: Partial<ReturnType<typeof testConfig>['swagger']>;
} 
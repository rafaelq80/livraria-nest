export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiration: process.env.JWT_EXPIRATION || '1h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
  },
  auth: {
    usernameField: process.env.AUTH_USERNAME_FIELD || 'usuario',
    passwordField: process.env.AUTH_PASSWORD_FIELD || 'senha',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    sessionEnabled: process.env.AUTH_SESSION_ENABLED === 'true',
    maxLoginAttempts: parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION, 10) || 15 * 60 * 1000, // 15 min
  },
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Projeto Livraria',
    description: process.env.SWAGGER_DESCRIPTION || 'Projeto Livraria',
    version: process.env.SWAGGER_VERSION || '1.0',
    contact: {
      name: process.env.SWAGGER_CONTACT_NAME || 'Rafael Queiróz',
      url: process.env.SWAGGER_CONTACT_URL || 'https://github.com/rafaelq80',
      email: process.env.SWAGGER_CONTACT_EMAIL || 'rafaelproinfo@gmail.com',
    },
    path: process.env.SWAGGER_PATH || '/swagger',
  },
  app: {
    timezone: process.env.TZ || 'America/Sao_Paulo',
    environment: process.env.NODE_ENV || 'development',
  },
  imagekit: {
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    urlDelete: process.env.IMAGEKIT_URL_DELETE,
    maxFileSize: parseInt(process.env.IMAGEKIT_MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedTypes: process.env.IMAGEKIT_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/jpg', 'image/png'],
    compressionQuality: parseFloat(process.env.IMAGEKIT_COMPRESSION_QUALITY) || 0.8,
    minWidth: parseInt(process.env.IMAGEKIT_MIN_WIDTH, 10) || 100,
    maxWidth: parseInt(process.env.IMAGEKIT_MAX_WIDTH, 10) || 4000,
    minHeight: parseInt(process.env.IMAGEKIT_MIN_HEIGHT, 10) || 100,
    maxHeight: parseInt(process.env.IMAGEKIT_MAX_HEIGHT, 10) || 4000,
    maxAspectRatio: parseFloat(process.env.IMAGEKIT_MAX_ASPECT_RATIO) || 10.0,
    minAspectRatio: parseFloat(process.env.IMAGEKIT_MIN_ASPECT_RATIO) || 0.1,
    uploadTimeout: parseInt(process.env.IMAGEKIT_UPLOAD_TIMEOUT, 10) || 30000, // 30s
    deleteTimeout: parseInt(process.env.IMAGEKIT_DELETE_TIMEOUT, 10) || 10000, // 10s
    cacheTtl: parseInt(process.env.IMAGEKIT_CACHE_TTL, 10) || 5 * 60 * 1000, // 5 minutos
    cacheMaxSize: parseInt(process.env.IMAGEKIT_CACHE_MAX_SIZE, 10) || 1000,
    cacheCleanupInterval: parseInt(process.env.IMAGEKIT_CACHE_CLEANUP_INTERVAL, 10) || 60 * 1000, // 1 minuto
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.MAIL_FROM || process.env.EMAIL_USER,
    maxRetries: parseInt(process.env.MAIL_MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.MAIL_RETRY_DELAY, 10) || 1000,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: {
      rejectUnauthorized: false
    }
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
  },
}); 
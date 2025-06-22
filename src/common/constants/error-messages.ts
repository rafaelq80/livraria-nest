export const ErrorMessages = {
    // Autenticação
    AUTH: {
        INVALID_CREDENTIALS: "Credenciais inválidas.",
        MISSING_CREDENTIALS: "Credenciais ausentes. Por favor, forneça o usuário e senha.",
        UNAUTHORIZED: "Não autorizado.",
        USER_NOT_FOUND: "Usuário não encontrado.",
        USER_NOT_AUTHENTICATED: "Usuário não autenticado.",
        INVALID_PASSWORD: "Senha incorreta.",
        INVALID_TOKEN: "Token de autenticação inválido ou expirado.",
        GOOGLE_AUTH_FAILED: "Falha na autenticação com Google.",
        GOOGLE_INTERNAL_ERROR: "Erro interno na autenticação com Google.",
        GOOGLE_EMAIL_NOT_FOUND: "E-mail não encontrado no perfil do Google.",
        GOOGLE_EMAIL_NOT_VERIFIED: "E-mail do Google não verificado.",
        GOOGLE_EMAIL_MISMATCH: "E-mail do token não corresponde ao e-mail do perfil.",
        GOOGLE_TOKEN_INVALID: "Token do Google inválido.",
        NO_ROLES: "Usuário sem permissões definidas.",
        INSUFFICIENT_PERMISSIONS: "Permissões insuficientes para acessar este recurso.",
        INVALID_PAYLOAD: "Payload inválido.",
        CREDENTIALS_REQUIRED: "Usuário e senha são obrigatórios.",
        TOO_MANY_ATTEMPTS: "Muitas tentativas. Tente novamente em 15 minutos.",
    },

    // Usuário
    USER: {
        NOT_FOUND: "Usuário não encontrado.",
        ALREADY_EXISTS: "Usuário já existe.",
        INVALID_ID: "ID do usuário inválido.",
        INVALID_DATA: "Dados do usuário inválidos.",
        PASSWORD_MISMATCH: "A nova senha deve ser diferente da senha atual.",
        EMAIL_REQUIRED: "E-mail é obrigatório.",
        EMAIL_INVALID: "E-mail inválido.",
        PASSWORD_REQUIRED: "Senha é obrigatória.",
        PASSWORD_WEAK: "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.",
        ROLES_INVALID: "Uma ou mais roles são inválidas.",
        ROLES_NOT_FOUND: "Uma ou mais roles não foram encontradas.",
    },

    // Roles (Permissões)
    ROLE: {
        NOT_FOUND: "Role não encontrada.",
        ALREADY_EXISTS: "Role já existe.",
        INVALID_ID: "ID da permissão inválido.",
        INVALID_DATA: "Dados da role inválidos.",
        CANNOT_DELETE_WITH_USERS: "Não é possível remover uma role associada a usuários. Transfira ou remova os usuários antes.",
    },

    // Autor
    AUTHOR: {
        NOT_FOUND: "Autor não encontrado.",
        ALREADY_EXISTS: "Autor já existe.",
        INVALID_ID: "ID do autor inválido.",
        INVALID_DATA: "Dados do autor inválidos.",
    },

    // Produto
    PRODUTO: {
        NOT_FOUND: "Produto não encontrado.",
        ALREADY_EXISTS: "Produto já existe.",
        INVALID_DATA: "Dados do produto inválidos.",
    },

    // Editora
    EDITORA: {
        NOT_FOUND: "Editora não encontrada.",
        ALREADY_EXISTS: "Editora já existe.",
        INVALID_DATA: "Dados da editora inválidos.",
    },

    // Categoria
    CATEGORIA: {
        NOT_FOUND: "Categoria não encontrada.",
        ALREADY_EXISTS: "Categoria já existe.",
        INVALID_DATA: "Dados da categoria inválidos.",
    },

    // Imagens
    IMAGE: {
        NOT_PROVIDED: "Arquivo de imagem não fornecido.",
        INVALID_FORMAT: "Formato de arquivo inválido. Apenas imagens JPG, JPEG, PNG e GIF são permitidas.",
        SIZE_EXCEEDED: "O arquivo excede o tamanho máximo permitido de 5MB.",
        INVALID_URL: "URL da imagem inválida.",
        DOWNLOAD_ERROR: "Erro ao baixar a imagem.",
        UPLOAD_FAILED: "Falha ao fazer upload da imagem.",
        DELETE_FAILED: "Falha ao excluir a imagem.",
        CONFIGURATION_ERROR: "Configuração do ImageKit inválida.",
        NETWORK_ERROR: "Erro de conexão com o serviço de imagens.",
        INVALID_FILE: "Arquivo de imagem inválido ou corrompido.",
        FOLDER_ERROR: "Erro ao criar pasta no serviço de imagens.",
        FILE_CORRUPTED: "Arquivo de imagem corrompido.",
    },

    // Geral
    GENERAL: {
        INVALID_ID: "Id inválido.",
        OPERATION_FAILED: "Operação falhou.",
        VALIDATION_FAILED: "Validação falhou.",
        SERVER_ERROR: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
    },

    // E-mail
    EMAIL: {
        SEND_ERROR: "Erro ao enviar e-mail.",
        RECOVERY_LINK_EXPIRED: "O link de recuperação expirou.",
        RECOVERY_LINK_INVALID: "Link de recuperação inválido.",
        PASSWORDS_DONT_MATCH: "As senhas não coincidem.",
        INVALID_DESTINATION: "Email de destino inválido.",
        TEMPLATE_NOT_FOUND: "Template de email não encontrado.",
    },
} as const; 
export const ErrorMessages = {
    // Autenticação
    AUTH: {
        INVALID_CREDENTIALS: "Credenciais inválidas.",
        MISSING_CREDENTIALS: "Credenciais ausentes. Por favor, forneça o usuário e senha.",
        UNAUTHORIZED: "Não autorizado.",
        USER_NOT_FOUND: "Usuário não encontrado.",
        INVALID_PASSWORD: "Senha incorreta.",
        INVALID_TOKEN: "Token de autenticação inválido ou expirado.",
        GOOGLE_AUTH_FAILED: "Falha na autenticação com Google.",
        GOOGLE_INTERNAL_ERROR: "Erro interno na autenticação com Google.",
        GOOGLE_EMAIL_NOT_FOUND: "E-mail não encontrado no perfil do Google.",
        GOOGLE_EMAIL_NOT_VERIFIED: "E-mail do Google não verificado.",
        GOOGLE_EMAIL_MISMATCH: "E-mail do token não corresponde ao e-mail do perfil.",
        GOOGLE_TOKEN_INVALID: "Token do Google inválido.",
        NO_ROLES: "Usuário sem permissões definidas.",
        INVALID_PAYLOAD: "Payload inválido.",
        CREDENTIALS_REQUIRED: "Usuário e senha são obrigatórios.",
    },

    // Usuário
    USER: {
        NOT_FOUND: "Usuário não encontrado.",
        ALREADY_EXISTS: "Usuário já existe.",
        INVALID_ID: "ID do usuário inválido.",
        INVALID_DATA: "Dados do usuário inválidos.",
        PASSWORD_MISMATCH: "As senhas não coincidem.",
        PASSWORD_REQUIREMENTS: "A senha deve ter no mínimo 8 caracteres.",
        RECOVERY_LINK_EXPIRED: "O link de recuperação de senha expirou. Por favor, solicite um novo.",
        RECOVERY_LINK_INVALID: "Link de recuperação de senha inválido.",
        EMAIL_REQUIRED: "E-mail é obrigatório.",
        EMAIL_INVALID: "E-mail inválido.",
        PASSWORD_REQUIRED: "Senha é obrigatória.",
        PASSWORD_WEAK: "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.",
        USERNAME_REQUIRED: "Usuário é obrigatório.",
        ROLES_INVALID: "Uma ou mais roles são inválidas.",
        ROLES_NOT_FOUND: "Uma ou mais roles não foram encontradas.",
    },

    // Roles (Permissões)
    ROLE: {
        NOT_FOUND: "Role não encontrada.",
        ALREADY_EXISTS: "Role já existe.",
        INVALID_ID: "ID da permissão inválido.",
        INVALID_DATA: "Dados da role inválidos.",
        NOT_FOUND_MULTIPLE: "Algumas permissões não foram encontradas: ",
    },

    // Autor
    AUTHOR: {
        NOT_FOUND: "Autor não encontrado.",
        ALREADY_EXISTS: "Autor já existe.",
        INVALID_ID: "ID do autor inválido.",
        INVALID_DATA: "Dados do autor inválidos.",
        NOT_FOUND_MULTIPLE: "Alguns autores não foram encontrados: ",
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
    },

    // Geral
    GENERAL: {
        INVALID_REQUEST: "Requisição inválida.",
        SERVER_ERROR: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
        FORBIDDEN: "Você não tem permissão de acesso.",
        INVALID_ID: "Id inválido.",
        OPERATION_FAILED: "Operação falhou.",
        VALIDATION_FAILED: "Validação falhou.",
    },

    // E-mail
    EMAIL: {
        SEND_ERROR: "Erro ao enviar e-mail.",
        RECOVERY_LINK_EXPIRED: "O link de recuperação expirou.",
        RECOVERY_LINK_INVALID: "Link de recuperação inválido.",
        PASSWORDS_DONT_MATCH: "As senhas não coincidem.",
    },
} as const; 
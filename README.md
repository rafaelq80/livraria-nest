# Projeto Livraria - Backend

<br />

<div align="center">
    <img src="https://i.imgur.com/icgjsRQ.png" title="source: imgur.com" width="50%"/>
</div>


<br /><br />

## 1. Descrição

O **Projeto Livraria** é uma **API REST** desenvolvida com **NestJS**, voltada para a gestão de uma livraria online. O sistema permite o gerenciamento de **produtos (livros), autores, editoras, categorias, usuários e permissões (roles)**.

A aplicação foi projetada para oferecer uma plataforma segura e eficiente para administração de catálogos de livros e gestão de usuários. O projeto possui integração com um frontend web e, futuramente, um aplicativo mobile para melhorar a experiência de compra e navegação.

------

## 2. Sobre esta API

Esta API foi desenvolvida utilizando **NestJS** para criar a estrutura básica de um sistema de livraria. Ela fornece endpoints para gerenciar usuários (e suas permissões), produtos, autores, editoras e categorias.

<br />

### 2.1. Principais Funcionalidades

1. **Gerenciamento de Produtos**: Cadastro, leitura, atualização e exclusão de livros, com informações como título, preço, autor, editora e categoria.
2. **Gerenciamento de Autores**: Cadastro de autores e seus livros, associando-os aos produtos.
3. **Gerenciamento de Editoras**: Cadastro e vinculação de editoras aos produtos.
4. **Gestão de Categorias**: Organize os produtos em diferentes categorias para facilitar a navegação.
5. **Cadastro de Usuários**: Gerencie os perfis de clientes, com informações como nome, email e senha.
6. **Sistema de Roles (Permissões)**: Controle de acesso baseado em papéis (roles) para definir quais usuários podem acessar ou modificar recursos específicos.
7. **Autenticação com JWT**: Proteção de rotas com autenticação baseada em token JWT, garantindo a segurança e privacidade das informações.

------

## 3. Diagrama de Classes

```mermaid
classDiagram
class Categoria {
  - id : number
  - tipo : string
  - produto : []Produto
  + findAll()
  + findById(id : number)
  + findAllByTipo(tipo : string)
  + create(categoria : Categoria)
  + update(categoria : Categoria)
  + delete(id : number)
}
class Editora {
  - id : number
  - nome : string
  - produto : []Produto
  + findAll()
  + findById(id : number)
  + findByNome(nome : string)
  + create(editora : Editora)
  + update(editora : Editora)
  + delete(id : number)
}
class Produto {
  - id : number
  - titulo : string
  - preco : number
  - foto : string
  - autores : []Autor
  - categoria : Categoria
  - editora : Editora
  + findAll()
  + findById(id : number)
  + findAllByTitulo(titulo : string)
  + create(produto : Produto)
  + update(produto : Produto)
  + delete(id : number)
}
class Autor {
  - id : number
  - nome : string
  - nacionalidade: string
  - produtos : []Produto
  + findAll()
  + findById(id : number)
  + findAllByNome(nome : string)
  + create(autor : Autor)
  + update(autor : Autor)
  + delete(id : number)
}
class Usuario {
  - id : number
  - nome : string
  - usuario : string
  - senha : string
  - foto : string
  - roles : []Role
  + findAll()
  + findById(id : number)
  + create(usuario : Usuario)
  + update(usuario : Usuario)
  + delete(id : number)
  + autenticar(usuariologin : UsuarioLogin)
}
class Role {
  - id : number
  - nome : string
  - usuarios : []Usuario
  + findAll()
  + findById(id : number)
  + findAllByNome(nome : string)
  + create(role : Role)
  + update(role : Role)
  + delete(id : number)
}
Categoria "1" <--> "*" Produto
Autor "*" <--> "*" Produto
Editora "1" <--> "*" Produto
Role "*" <--> "*" Usuario
```

------

## 4. Diagrama Entidade-Relacionamento (DER)



<div align="center">
    <img src="https://i.imgur.com/VKs5jrJ.png" title="source: imgur.com" />
</div>



------

## 5. Tecnologias utilizadas

| Item                          | Descrição  |
| ----------------------------- | ---------- |
| **Servidor**                  | Node JS    |
| **Linguagem de programação**  | TypeScript |
| **Framework**                 | Nest JS    |
| **ORM**                       | TypeORM    |
| **Banco de dados Relacional** | MySQL      |

------

## 6. Configuração e Execução

1. Clone o repositório:

   ```
   git clone https://github.com/usuario/livraria-backend.git
   ```
2. Acesse a pasta do projeto:

   ```
   cd livraria-backend
   ```

3. Instale as dependências:

   ```
   npm install
   ```

4. Crie o banco de dados `db_livraria` no MySQL

5. Crie o arquivo `.env` na pasta raiz do projeto
6. Configure a conexão com o banco de dados e a secret (chave de assinatura do token JWT), no arquivo `.env`, através das variáveis de ambiente abaixo:

```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=seu_usuario
DATABASE_PASSWORD=sua_senha
DATABASE_NAME=db_livraria
JWT_SECRET=sua_chave_secreta
BACKEND_URL=http://localhost:4000 ou endereço do deploy do Backend
FRONTEND_URL=http://localhost:5173 ou endereço do deploy do Frontend
EMAIL_USER= Endereço do Gmail válido)
EMAIL_PASSWORD= Senha de aplicativo do Gmail (https://myaccount.google.com/apppasswords)
IMAGEKIT_PRIVATE_KEY= Chave Privada da sua conta no imagekit (https://imagekit.io/)
IMAGEKIT_URL_ENDPOINT=https://upload.imagekit.io/api/v1/files/upload
IMAGEKIT_URL_DELETE=https://api.imagekit.io/v1/files
```

**IMPORTANTE:** Não utilize a senha de acesso a conta do Gmail, crie uma senha de aplicativo, através do link indicado ao lado.


7. Execute a aplicação: `npm run start:dev`

------

## 7. Estrutura do Projeto

A estrutura do projeto foi organizada da seguinte forma:

```
src/
│
├── autor/             # Módulo de Autores
├── categoria/         # Módulo de Categorias
├── data/              # Configurações do banco de dados
├── editora/           # Módulo de Editoras
├── imagekit/          # Módulo de integração com a API do Imagekit
├── produto/           # Módulo de Produtos
├── role/              # Módulo de Roles
├── security/          # Módulo de autenticação
├── sendmail/          # Módulo de envio de e-mail
├── usuario/           # Módulo de Usuários
├── util/              # Funções auxiliares (ex: cálculos, conversores, entre outros)
└── app.module.ts      # Módulo principal da aplicação

```



------

## 8. Implementações Futuras

- [ ] **Avaliações de Produtos**: Implementar a função Curtir Produto
- [x] **Envio de imagens para o Imagekit**: Implementar o upload de imagens para o imagekit.
- [x] **Envio de E-mail**: Implementar notificações por e-mail para os usuários (ex.: confirmação de cadastro).
- [x] **Recuperação de senha**: Implementar a recuperação da senha do usuário.
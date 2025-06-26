// Funções utilitárias para payloads e helpers de produto
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { CriarAutorDto } from "../../src/autor/dtos/criarautor.dto"
import { AtualizarAutorDto } from "../../src/autor/dtos/atualizarautor.dto"
import { CriarCategoriaDto } from "../../src/categoria/dtos/criarcategoria.dto"
import { AtualizarCategoriaDto } from "../../src/categoria/dtos/atualizarcategoria.dto"
import { CriarEditoraDto } from "../../src/editora/dtos/criareditora.dto"
import { AtualizarEditoraDto } from "../../src/editora/dtos/atualizareditora.dto"
import { CriarProdutoDto } from "../../src/produto/dtos/criarproduto.dto"
import { AtualizarProdutoDto } from "../../src/produto/dtos/atualizarproduto.dto"
import { CriarUsuarioDto } from "../../src/usuario/dtos/criarusuario.dto"
import { AtualizarUsuarioDto } from "../../src/usuario/dtos/atualizarusuario.dto"
import { CriarRoleDto } from "../../src/role/dtos/criarrole.dto"
import { AtualizarRoleDto } from "../../src/role/dtos/atualizarrole.dto"

export function criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, overrides: Partial<CriarProdutoDto> = {}): CriarProdutoDto {
	return {
		titulo: "Livro Teste",
		sinopse: "Sinopse válida para o livro.",
		paginas: 100,
		anoPublicacao: 2022,
		preco: 50,
		idioma: "Português",
		isbn10: gerarISBN10(),
		isbn13: gerarISBN13(),
		desconto: 0,
		edicao: 1,
		categoria: { id: testCategoria.id },
		editora: { id: testEditora.id },
		autores: [{ id: testAutor.id }],
		...overrides
	}
}

export function criarProdutoInvalidoPayload(testCategoria, testEditora, testAutor, overrides: Partial<CriarProdutoDto> = {}): Partial<CriarProdutoDto> {
	return {
		titulo: "JS",
		sinopse: "curta",
		paginas: 0,
		anoPublicacao: 1799,
		preco: -10,
		idioma: "Chinês",
		isbn10: "123",
		isbn13: "456",
		categoria: { id: testCategoria.id },
		editora: { id: testEditora.id },
		autores: [{ id: testAutor.id }],
		...overrides
	}
}

export function criarProdutoUpdatePayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, id: number, overrides: Partial<AtualizarProdutoDto> = {}): AtualizarProdutoDto {
	return {
		id,
		titulo: "Livro Atualizado",
		sinopse: "Sinopse válida do livro para update.",
		paginas: 200,
		anoPublicacao: 2023,
		preco: 99.99,
		idioma: "Português",
		isbn10: gerarISBN10(),
		isbn13: gerarISBN13(),
		desconto: 0,
		edicao: 1,
		categoria: { id: testCategoria.id },
		editora: { id: testEditora.id },
		autores: [{ id: testAutor.id }],
		...overrides
	}
}

export async function criarProdutoNoBanco(app: INestApplication, testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, payloadOverrides: Partial<CriarProdutoDto> = {}) {
	const produtoPayload = criarProdutoPayload(testCategoria, testEditora, testAutor, gerarISBN10, gerarISBN13, payloadOverrides);
	const response = await request(app.getHttpServer())
		.post("/produtos")
		.set("Authorization", "Bearer mock-token")
		.send(produtoPayload);
	return response.body.data;
}

// --- Helpers para AUTOR ---
export function criarAutorPayload(overrides: Partial<CriarAutorDto> = {}): CriarAutorDto {
	return {
		nome: 'Autor Teste',
		nacionalidade: 'Brasileira',
		...overrides
	};
}

export function criarAutorUpdatePayload(id: number, overrides: Partial<AtualizarAutorDto> = {}): AtualizarAutorDto {
	return {
		id,
		nome: 'Autor Teste Atualizado',
		nacionalidade: 'Brasileira',
		...overrides
	};
}

export async function criarAutorNoBanco(app: INestApplication, overrides: Partial<CriarAutorDto> = {}) {
	const payload = criarAutorPayload(overrides);
	const response = await request(app.getHttpServer())
		.post('/autores')
		.set('Authorization', 'Bearer mock-token')
		.send(payload);
	return response.body.data;
}

// --- Helpers para CATEGORIA ---
export function criarCategoriaPayload(overrides: Partial<CriarCategoriaDto> = {}): CriarCategoriaDto {
	return {
		tipo: 'Categoria Teste',
		...overrides
	};
}

export function criarCategoriaUpdatePayload(id: number, overrides: Partial<AtualizarCategoriaDto> = {}): AtualizarCategoriaDto {
	return {
		id,
		tipo: 'Categoria Teste Atualizada',
		...overrides
	};
}

export async function criarCategoriaNoBanco(app: INestApplication, overrides: Partial<CriarCategoriaDto> = {}) {
	const payload = criarCategoriaPayload(overrides);
	const response = await request(app.getHttpServer())
		.post('/categorias')
		.set('Authorization', 'Bearer mock-token')
		.send(payload);
	return response.body.data;
}

// --- Helpers para EDITORA ---
export function criarEditoraPayload(overrides: Partial<CriarEditoraDto> = {}): CriarEditoraDto {
	return {
		nome: 'Editora Teste',
		...overrides
	};
}

export function criarEditoraUpdatePayload(id: number, overrides: Partial<AtualizarEditoraDto> = {}): AtualizarEditoraDto {
	return {
		id,
		nome: 'Editora Teste Atualizada',
		...overrides
	};
}

export async function criarEditoraNoBanco(app: INestApplication, overrides: Partial<CriarEditoraDto> = {}) {
	const payload = criarEditoraPayload(overrides);
	const response = await request(app.getHttpServer())
		.post('/editoras')
		.set('Authorization', 'Bearer mock-token')
		.send(payload);
	return response.body.data;
}

// --- Helpers para ROLE ---
export function criarRolePayload(overrides: Partial<CriarRoleDto> = {}): CriarRoleDto {
	return {
		nome: 'ROLE_TESTE',
		descricao: 'Role de teste para validação',
		...overrides
	};
}

export function criarRoleUpdatePayload(id: number, overrides: Partial<AtualizarRoleDto> = {}): AtualizarRoleDto {
	return {
		id,
		nome: 'ROLE_TESTE_ATUALIZADA',
		descricao: 'Role de teste atualizada',
		...overrides
	};
}

export async function criarRoleNoBanco(app: INestApplication, overrides: Partial<CriarRoleDto> = {}) {
	const payload = criarRolePayload(overrides);
	const response = await request(app.getHttpServer())
		.post('/roles')
		.set('Authorization', 'Bearer mock-token')
		.send(payload);
	return response.body.data;
}

// --- Helpers para USUARIO ---
export function criarUsuarioPayload(overrides: Partial<CriarUsuarioDto> = {}): CriarUsuarioDto {
	return {
		nome: 'Usuário Teste',
		usuario: overrides.usuario ?? `usuario${Date.now()}@teste.com`,
		senha: 'SenhaForte123!',
		roles: overrides.roles ?? [{ id: 1 }],
		...overrides
	};
}

export function criarUsuarioUpdatePayload(id: number, overrides: Partial<Omit<CriarUsuarioDto, 'senha'>> = {}): AtualizarUsuarioDto {
	return {
		id,
		nome: overrides.nome,
		usuario: overrides.usuario,
		senha: 'SenhaForte123!',
		roles: [{ id: 1 }],
		...overrides
	};
}

export async function criarUsuarioNoBanco(app: INestApplication, overrides: Partial<CriarUsuarioDto> = {}) {
	const payload = criarUsuarioPayload(overrides);
	const response = await request(app.getHttpServer())
		.post('/usuarios/cadastrar')
		.set('Authorization', 'Bearer mock-token')
		.send(payload);
	return response.body.data;
} 
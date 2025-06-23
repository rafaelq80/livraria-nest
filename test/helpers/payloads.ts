// Funções utilitárias para payloads e helpers de produto
import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { CriarAutorDto } from "../../src/autor/dtos/criarautor.dto"
import { AtualizarAutorDto } from "../../src/autor/dtos/atualizarautor.dto"
import { CriarCategoriaDto } from "../../src/categoria/dtos/criarcategoria.dto"
import { AtualizarCategoriaDto } from "../../src/categoria/dtos/atualizarcategoria.dto"
import { CriarEditoraDto } from "../../src/editora/dtos/criareditora.dto"
import { AtualizarEditoraDto } from "../../src/editora/dtos/atualizareditora.dto"
import { CriarProdutoDto } from "../../src/produto/dtos/criarproduto.dto"
import { AtualizarProdutoDto } from "../../src/produto/dtos/atualizarproduto.dto"

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
	return await request(app.getHttpServer())
		.post("/produtos")
		.set("Authorization", "Bearer mock-token")
		.send(produtoPayload)
		.expect(HttpStatus.CREATED);
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
	return await request(app.getHttpServer())
		.post('/autores')
		.set('Authorization', 'Bearer mock-token')
		.send(payload)
		.expect(HttpStatus.CREATED);
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
	return await request(app.getHttpServer())
		.post('/categorias')
		.set('Authorization', 'Bearer mock-token')
		.send(payload)
		.expect(HttpStatus.CREATED);
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
	return await request(app.getHttpServer())
		.post('/editoras')
		.set('Authorization', 'Bearer mock-token')
		.send(payload)
		.expect(HttpStatus.CREATED);
} 
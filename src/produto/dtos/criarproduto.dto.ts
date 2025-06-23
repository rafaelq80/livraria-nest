import { ApiProperty } from "@nestjs/swagger"
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested, ArrayMinSize } from "class-validator"
import { Type , Transform } from 'class-transformer'
import { Autor } from "../../autor/entities/autor.entity"
import { Categoria } from "../../categoria/entities/categoria.entity"
import { Editora } from "../../editora/entities/editora.entity"
import { IsISBN10, IsISBN13 } from "../validators/isisbn.validator"

// DTOs Auxiliares
export class CategoriaIdDto {
	@IsNumber()
	id: number;
}

export class EditoraIdDto {
	@IsNumber()
	id: number;
}

export class AutorIdDto {
	@IsNumber()
	id: number;
}

export class CriarProdutoDto {
	@ApiProperty({
		description: "Título do livro",
		example: "Dom Casmurro",
	})
	@IsString({ message: "Título deve ser uma string" })
	@Length(2, 255, { message: "Título deve ter entre 2 e 255 caracteres" })
	@IsNotEmpty({ message: "Título é obrigatório" })
	titulo: string

	@ApiProperty({
		description: "Sinopse do livro",
		example: "Dom Casmurro é um romance escrito por Machado de Assis...",
	})
	@IsString({ message: "Sinopse deve ser uma string" })
	@Length(10, 5000, { message: "Sinopse deve ter entre 10 e 5000 caracteres" })
	@IsNotEmpty({ message: "Sinopse é obrigatória" })
	sinopse: string

	@ApiProperty({
		description: "Preço do livro",
		example: 49.9,
		minimum: 0,
	})
	@IsNumber({}, { message: "Preço deve ser um número" })
	@Min(0, { message: "Preço não pode ser negativo" })
	@IsNotEmpty({ message: "Preço é obrigatório" })
	preco: number

	@ApiProperty({
		description: "Número de páginas",
		example: 256,
		minimum: 1,
	})
	@IsNumber({}, { message: "Número de páginas deve ser um número" })
	@Min(1, { message: "Número de páginas deve ser maior que zero" })
	@IsNotEmpty({ message: "Número de páginas é obrigatório" })
	paginas: number

	@ApiProperty({
		description: "Ano de publicação",
		example: 2023,
		minimum: 1800,
	})
	@IsNumber({}, { message: "Ano de publicação deve ser um número" })
	@Min(1800, { message: "Ano de publicação deve ser maior que 1800" })
	@Max(new Date().getFullYear(), {
		message: "Ano de publicação não pode ser maior que o ano atual",
	})
	@IsNotEmpty({ message: "Ano de publicação é obrigatório" })
	anoPublicacao: number

	@ApiProperty({
		description: "Idioma do livro",
		example: "Português",
		enum: ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Outros"],
	})
	@IsOptional()
	@IsString({ message: "Idioma deve ser uma string" })
	@Length(2, 50, { message: "Idioma deve ter entre 2 e 50 caracteres" })
	@IsIn(["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Outros"], {
		message: "Idioma deve ser um dos valores permitidos",
	})
	idioma?: string

	@ApiProperty({
		description: "ISBN-10 do livro",
		example: "0-306-40615-2",
		required: false,
	})
	@IsOptional()
	@IsISBN10({ message: "ISBN-10 inválido" })
	isbn10?: string

	@ApiProperty({
		description: "ISBN-13 do livro",
		example: "978-3-16-148410-0",
		required: false,
	})
	@IsOptional()
	@IsISBN13({ message: "ISBN-13 inválido" })
	isbn13?: string

	@ApiProperty({
		description: "Desconto do livro",
		example: 10,
		minimum: 0,
		maximum: 100,
	})
	@IsOptional()
	@IsNumber({}, { message: "Desconto deve ser um número" })
	@Min(0, { message: "Desconto não pode ser negativo" })
	@Max(100, { message: "Desconto não pode ser maior que 100" })
	desconto?: number

	@ApiProperty({
		description: "Edição do Livro",
		example: 1,
		minimum: 1,
	})
	@IsNotEmpty({ message: "Número da Edição do livro é obrigatório" })
	@Min(1, { message: "Número da Edição do livro deve ser maior que zero" })
	edicao?: number

	@ApiProperty({
		description: "URL da foto do livro",
		example: "https://exemplo.com/foto.jpg",
		required: false,
	})
	@IsString({ message: "URL da foto deve ser uma string" })
	@Length(5, 5000, { message: "URL da foto deve ter entre 5 e 5000 caracteres" })
	@IsOptional()
	foto?: string

	@ApiProperty({
		description: "Autores do livro",
		type: () => [Autor],
	})
	@ArrayMinSize(1, { message: 'Pelo menos um autor é obrigatório' })
	@ValidateNested({ each: true })
	@Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
	@Type(() => AutorIdDto)
	autores: AutorIdDto[]

	@ApiProperty({
		description: "Categoria do livro",
		type: () => Categoria,
	})
	@ValidateNested()
	@Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
	@Type(() => CategoriaIdDto)
	categoria: CategoriaIdDto

	@ApiProperty({
		description: "Editora do livro",
		type: () => Editora,
	})
	@ValidateNested()
	@Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
	@Type(() => EditoraIdDto)
	editora: EditoraIdDto
}


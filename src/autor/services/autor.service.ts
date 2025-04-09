import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, In, Repository } from "typeorm"
import { Autor } from "../entities/autor.entity"
import { Produto } from "../../produto/entities/produto.entity"
import { HasId } from "../../types/hasid"

@Injectable()
export class AutorService {
	constructor(
		@InjectRepository(Autor)
		private autorRepository: Repository<Autor>,
	) {}

	async findAll(): Promise<Autor[]> {
		return await this.autorRepository.find({
			relations: {
				produtos: true,
			},
			order: {
				nome: "ASC",
			},
		})
	}

	async findById(id: number): Promise<Autor> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		const autor = await this.autorRepository.findOne({
			where: {
				id,
			},
			relations: {
				produtos: true,
			},
		})

		if (!autor) throw new HttpException("Autor não encontrado!", HttpStatus.NOT_FOUND)

		return autor
	}

	async findByNome(nome: string): Promise<Autor[]> {
		return await this.autorRepository.find({
			where: {
				nome: ILike(`%${nome.trim()}%`),
			},
			relations: {
				produtos: true,
			},
			order: {
				nome: "ASC",
			},
		})
	}

	async create(autor: Autor): Promise<Autor> {
		if (!autor) throw new HttpException("Dados do autor inválidos", HttpStatus.BAD_REQUEST)

		return await this.autorRepository.save(autor)
	}

	async update(autor: Autor): Promise<Autor> {
		if (!autor || !autor.id) throw new HttpException("Autor inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(autor.id)

		return await this.autorRepository.save(autor)
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(id)

		return await this.autorRepository.delete(id)
	}

	async processarAutores(produto: Produto): Promise<Produto> {
		// Se não tem autors, retorna array vazio
		if (!produto.autores) return { ...produto, autores: [] }
		try {
			// Verifica se a entrada é uma string e converte para objeto
			const autoresData =
				typeof produto.autores === "string" ? JSON.parse(produto.autores) : produto.autores

			// Verifica se é um array
			if (!Array.isArray(autoresData)) {
				throw new BadRequestException("O campo autors deve ser um array")
			}

			// Extrai os IDs válidos
			const autorIds = this.extrairIdsValidos(autoresData)

			// Busca os autors completos no banco de dados
			const autores = await this.autorRepository.findBy({
				id: In(autorIds), // Usando o operador In do TypeORM
			})

			// Verifica se todos os autors foram encontrados
			if (autores.length !== autorIds.length) {
				throw new BadRequestException("Algumas autors não foram encontradas")
			}

			// Valida os autors encontrados
			await this.validateAutores(autores)

			return { ...produto, autores }
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new BadRequestException("Formato inválido para o campo autores")
		}
	}

	async validateAutores(autors: Autor[]): Promise<void> {
		if (!autors || !Array.isArray(autors)) {
			throw new BadRequestException("Lista de autores inválida")
		}

		for (const autor of autors) {
			await this.findById(autor.id)
		}
	}

	// Extrai ids válidos (números > 0) de diversos formatos possíveis
	private extrairIdsValidos(items: unknown[]): number[] {
		return items
			.map((item) => {
				// Se for um número, retorna ele mesmo
				if (typeof item === "number") return item

				// Se for um objeto com id, retorna o id
				if (typeof item === "object" && item && "id" in item) {
					const id = (item as HasId).id
					return typeof id === "number" ? id : null
				}

				return null
			})
			.filter((id): id is number => typeof id === "number" && id > 0)
	}
}

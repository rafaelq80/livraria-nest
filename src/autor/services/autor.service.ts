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

	async findManyByIds(ids: number[]): Promise<Map<number, Autor>> {
		if (!ids.length) return new Map()

		const autores = await this.autorRepository.findBy({ id: In(ids) })

		if (autores.length !== ids.length) {
			const foundIds = autores.map((a) => a.id)
			const missingIds = ids.filter((id) => !foundIds.includes(id))
			throw new BadRequestException(`Autores não encontrados: ${missingIds.join(", ")}`)
		}

		return new Map(autores.map((autor) => [autor.id, autor]))
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
		if (!produto.autores) return { ...produto, autores: [] }

		try {
			// Padronizar o formato de entrada
			const autoresData = Array.isArray(produto.autores)
				? produto.autores
				: typeof produto.autores === "string"
					? JSON.parse(produto.autores)
					: []

			// Extrair IDs válidos
			const autorIds = this.extrairIdsValidos(autoresData)

			// Buscar todos os autores de uma vez
			const autoresMap = await this.findManyByIds(autorIds)
			const autores = autorIds.map((id) => autoresMap.get(id))

			return { ...produto, autores }
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new BadRequestException("Formato inválido para o campo autores")
		}
	}

	async validateAutores(autores: Autor[]): Promise<void> {
		if (!autores || !Array.isArray(autores)) {
			throw new BadRequestException("Lista de autores inválida")
		}

		if (autores.length === 0) return

		const ids = autores.map((autor) => autor.id)
		await this.findManyByIds(ids) // Já lança exceção se algum autor não existir
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

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, In, Repository } from "typeorm"
import { ErrorMessages } from "../../common/constants/error-messages"
import { Produto } from "../../produto/entities/produto.entity"
import { HasId } from "../../types/hasid"
import { Autor } from "../entities/autor.entity"

@Injectable()
export class AutorService {
	constructor(
		@InjectRepository(Autor)
		private readonly autorRepository: Repository<Autor>,
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
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const autor = await this.autorRepository.findOne({
			where: { id },
			relations: { produtos: true },
		})

		if (!autor) throw new NotFoundException(ErrorMessages.AUTHOR.NOT_FOUND)

		return autor
	}

	async findManyByIds(ids: number[]): Promise<Map<number, Autor>> {
		if (!ids.length) return new Map()

		const autores = await this.autorRepository.findBy({ id: In(ids) })

		if (autores.length !== ids.length) {
			const foundIds = autores.map((a) => a.id)
			const missingIds = ids.filter((id) => !foundIds.includes(id))
			throw new BadRequestException(`${ErrorMessages.AUTHOR.NOT_FOUND}: ${missingIds.join(", ")}`)
		}

		return new Map(autores.map((autor) => [autor.id, autor]))
	}

	async findByNome(nome: string): Promise<Autor[]> {
		return await this.autorRepository.find({
			where: {
				nome: ILike(`%${nome.trim()}%`),
			},
			relations: { produtos: true },
			order: { nome: "ASC" },
		})
	}

	async create(autor: Autor): Promise<Autor> {
		if (!autor) throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)

		return await this.autorRepository.save(autor)
	}

	async update(autor: Autor): Promise<Autor> {
		if (!autor?.id) throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)

		await this.findById(autor.id)

		return await this.autorRepository.save(autor)
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		await this.findById(id)

		return await this.autorRepository.delete(id)
	}

	async processarAutores(produto: Produto): Promise<Autor[]> {
		if (!produto.autores || produto.autores.length === 0) {
			return []
		}

		const autorIds = this.extrairIdsValidos(produto.autores)
		
		if (autorIds.length === 0) {
			throw new BadRequestException("Nenhum autor válido fornecido")
		}

		const autoresMap = await this.findManyByIds(autorIds)
		return autorIds.map((id) => autoresMap.get(id)!)
	}

	private extrairIdsValidos(autores: Autor[] | string | unknown[]): number[] {
		let autoresData: unknown[] = []

		if (Array.isArray(autores)) {
			autoresData = autores
		} else if (typeof autores === "string") {
			try {
				autoresData = JSON.parse(autores) as unknown[]
			} catch {
				throw new BadRequestException("Formato JSON inválido para autores")
			}
		} else {
			throw new BadRequestException("Formato inválido para o campo autores")
		}

		return autoresData
			.map((item) => {
				if (typeof item === "number") return item
				
				if (typeof item === "object" && item && "id" in item) {
					const id = (item as HasId).id
					return typeof id === "number" ? id : null
				}

				return null
			})
			.filter((id): id is number => typeof id === "number" && id > 0)
	}
}
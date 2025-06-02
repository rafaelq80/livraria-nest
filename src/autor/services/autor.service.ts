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
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

		const autor = await this.autorRepository.findOne({
			where: { id },
			relations: { produtos: true },
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
			relations: { produtos: true },
			order: { nome: "ASC" },
		})
	}

	async create(autor: Autor): Promise<Autor> {
		if (!autor) throw new HttpException("Dados do autor inválidos", HttpStatus.BAD_REQUEST)

		return await this.autorRepository.save(autor)
	}

	async update(autor: Autor): Promise<Autor> {
		if (!autor?.id) throw new HttpException("Autor inválido!", HttpStatus.BAD_REQUEST)

		await this.findById(autor.id)

		return await this.autorRepository.save(autor)
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new HttpException("Id inválido!", HttpStatus.BAD_REQUEST)

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
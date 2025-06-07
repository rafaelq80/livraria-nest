import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository } from "typeorm"
import { Categoria } from "../entities/categoria.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class CategoriaService {
	constructor(
		@InjectRepository(Categoria)
		private readonly categoriaRepository: Repository<Categoria>,
	) {}

	async findAll(): Promise<Categoria[]> {
		return await this.categoriaRepository.find({
			relations: {
				produtos: true,
			},
			order: {
				tipo: "ASC",
			},
		})
	}

	async findById(id: number): Promise<Categoria> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const categoria = await this.categoriaRepository.findOne({
			where: { id },
			relations: { produtos: true },
		})

		if (!categoria) throw new NotFoundException(ErrorMessages.CATEGORIA.NOT_FOUND)

		return categoria
	}

	async findByTipo(tipo: string): Promise<Categoria[]> {
		return await this.categoriaRepository.find({
			where: {
				tipo: ILike(`%${tipo.trim()}%`),
			},
			relations: {
				produtos: true,
			},
			order: {
				tipo: "ASC",
			},
		})
	}

	async create(categoria: Categoria): Promise<Categoria> {
		if (!categoria) throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)

		return await this.categoriaRepository.save(categoria)
	}

	async update(categoria: Categoria): Promise<Categoria> {
		if (!categoria?.id) throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)

		await this.findById(categoria.id)

		return await this.categoriaRepository.save(categoria)
	}

	async delete(id: number): Promise<void> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		await this.findById(id)
		await this.categoriaRepository.delete(id)
	}
}

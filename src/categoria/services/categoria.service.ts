import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository } from "typeorm"
import { Categoria } from "../entities/categoria.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class CategoriaService {
	private readonly logger = new Logger(CategoriaService.name)

	constructor(
		@InjectRepository(Categoria)
		private readonly categoriaRepository: Repository<Categoria>
	) {}

	async findAll(): Promise<Categoria[]> {
		return await this.categoriaRepository.find({
			relations: {
				produtos: true
			},
			order: {
				tipo: "ASC"
			}
		})
	}

	async findById(id: number): Promise<Categoria> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const categoria = await this.categoriaRepository.findOne({
			where: { id },
			relations: { produtos: true }
		})

		if (!categoria) throw new NotFoundException(ErrorMessages.CATEGORIA.NOT_FOUND)

		return categoria
	}

	async findAllByTipo(tipo: string): Promise<Categoria[]> {
		return await this.categoriaRepository.find({
			where: { tipo: ILike(`%${tipo.trim()}%`), },
			relations: {
				produtos: true
			}
		})
	}
	
	async findByTipo(tipo: string): Promise<Categoria | undefined> {
		return await this.categoriaRepository.findOne({
			where: { tipo },
			relations: { produtos: true }
		})
	}

	async create(categoria: Categoria): Promise<Categoria> {
		if (!categoria?.tipo?.trim()) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)
		}

		const categoriaExistente = await this.findByTipo(categoria.tipo.trim())
		if (categoriaExistente) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.ALREADY_EXISTS)
		}

		const novaCategoria = this.categoriaRepository.create({
			tipo: categoria.tipo.trim()
		})

		try {
			return await this.categoriaRepository.save(novaCategoria)
		} catch (error) {
			this.logger.error('Erro ao criar categoria:', error)
			throw error
		}
	}

	async update(categoria: Categoria): Promise<Categoria> {
		if (!categoria?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!categoria?.tipo?.trim()) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)
		}

		const categoriaAtual = await this.findById(categoria.id)

		const categoriaExistente = await this.findByTipo(categoria.tipo.trim())
		if (categoriaExistente && categoriaExistente.id !== categoria.id) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.ALREADY_EXISTS)
		}

		categoriaAtual.tipo = categoria.tipo.trim()

		try {
			return await this.categoriaRepository.save(categoriaAtual)
		} catch (error) {
			this.logger.error('Erro ao atualizar categoria:', error)
			throw error
		}
	}

	async delete(id: number): Promise<void> {
		const result = await this.categoriaRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.CATEGORIA.NOT_FOUND)
		}
	}
}

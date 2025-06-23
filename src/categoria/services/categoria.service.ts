import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository, In } from "typeorm"
import { Categoria } from "../entities/categoria.entity"
import { ErrorMessages } from "../../common/constants/error-messages"
import { CriarCategoriaDto } from "../dtos/criarcategoria.dto"
import { AtualizarCategoriaDto } from "../dtos/atualizarcategoria.dto"

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

	async findAllByIds(ids: number[]): Promise<Categoria[]> {
		if (!Array.isArray(ids) || ids.length === 0) return []
		return await this.categoriaRepository.find({
			where: { id: In(ids) }
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

	async create(categoriaDto: CriarCategoriaDto): Promise<Categoria> {
		if (!categoriaDto?.tipo?.trim()) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)
		}

		const categoriaExistente = await this.findByTipo(categoriaDto.tipo.trim())
		if (categoriaExistente) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.ALREADY_EXISTS)
		}

		try {
			return await this.categoriaRepository.save(categoriaDto)
		} catch (error) {
			this.logger.error('Erro ao criar categoria:', error)
			throw error
		}
	}

	async update(categoriaDto: AtualizarCategoriaDto): Promise<Categoria> {
		if (!categoriaDto?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!categoriaDto?.tipo?.trim()) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)
		}

		// Verificar se a categoria existe
		await this.findById(categoriaDto.id)

		// Verificar se já existe outra categoria com o mesmo tipo
		const categoriaExistente = await this.findByTipo(categoriaDto.tipo.trim())
		if (categoriaExistente && categoriaExistente.id !== categoriaDto.id) {
			throw new BadRequestException(ErrorMessages.CATEGORIA.ALREADY_EXISTS)
		}

		try {
			return await this.categoriaRepository.save(categoriaDto)
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

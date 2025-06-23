import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository, In } from "typeorm"
import { Autor } from "../entities/autor.entity"
import { ErrorMessages } from "../../common/constants/error-messages"
import { AtualizarAutorDto } from "../dtos/atualizarautor.dto"
import { CriarAutorDto } from "../dtos/criarautor.dto"

@Injectable()
export class AutorService {
	private readonly logger = new Logger(AutorService.name)

	constructor(
		@InjectRepository(Autor)
		private readonly autorRepository: Repository<Autor>
	) {}

	async findAll(): Promise<Autor[]> {
		return await this.autorRepository.find({
			relations: {
				produtos: true
			},
			order: {
				nome: "ASC"
			}
		})
	}

	async findAllByIds(ids: number[]): Promise<Autor[]> {
		if (!Array.isArray(ids) || ids.length === 0) return [];
		return await this.autorRepository.find({
			where: { id: In(ids) }
		});
	}

	async findById(id: number): Promise<Autor> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const autor = await this.autorRepository.findOne({
			where: { id },
			relations: { produtos: true }
		})

		if (!autor) throw new NotFoundException(ErrorMessages.AUTHOR.NOT_FOUND)

		return autor
	}

	async findAllByNome(nome: string): Promise<Autor[]> {
		return await this.autorRepository.find({
			where: { nome: ILike(`%${nome.trim()}%`), },
			relations: {
				produtos: true
			}
		})
	}

	async findByNome(nome: string): Promise<Autor | undefined> {
		return await this.autorRepository.findOne({
			where: { nome },
			relations: { produtos: true }
		})
	}

	async create(autorDto: CriarAutorDto): Promise<Autor> {
		if (!autorDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)
		}

		const autorExistente = await this.findByNome(autorDto.nome.trim())
		if (autorExistente) {
			throw new BadRequestException(ErrorMessages.AUTHOR.ALREADY_EXISTS)
		}

		try {
			return await this.autorRepository.save(autorDto)
		} catch (error) {
			this.logger.error('Erro ao criar autor:', error)
			throw error
		}
	}

	async update(autorDto: AtualizarAutorDto): Promise<Autor> {
		if (!autorDto?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!autorDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)
		}

		// Verificar se o autor existe
		await this.findById(autorDto.id)

		// Verificar se já existe outro autor com o mesmo nome
		const autorExistente = await this.findByNome(autorDto.nome.trim())
		if (autorExistente && autorExistente.id !== autorDto.id) {
			throw new BadRequestException(ErrorMessages.AUTHOR.ALREADY_EXISTS)
		}

		try {
			return await this.autorRepository.save(autorDto)
		} catch (error) {
			this.logger.error('Erro ao atualizar autor:', error)
			throw error
		}
	}

	async delete(id: number): Promise<void> {
		const result = await this.autorRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.AUTHOR.NOT_FOUND)
		}
	}

}

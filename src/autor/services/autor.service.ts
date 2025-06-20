import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository } from "typeorm"
import { Autor } from "../entities/autor.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

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

	async create(autor: Autor): Promise<Autor> {
		if (!autor?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)
		}

		const autorExistente = await this.findByNome(autor.nome.trim())
		if (autorExistente) {
			throw new BadRequestException(ErrorMessages.AUTHOR.ALREADY_EXISTS)
		}

		const novoAutor = this.autorRepository.create({
			nome: autor.nome.trim()
		})

		try {
			return await this.autorRepository.save(novoAutor)
		} catch (error) {
			this.logger.error('Erro ao criar autor:', error)
			throw error
		}
	}

	async update(autor: Autor): Promise<Autor> {
		if (!autor?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!autor?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.AUTHOR.INVALID_DATA)
		}

		const autorAtual = await this.findById(autor.id)

		const autorExistente = await this.findByNome(autor.nome.trim())
		if (autorExistente && autorExistente.id !== autor.id) {
			throw new BadRequestException(ErrorMessages.AUTHOR.ALREADY_EXISTS)
		}

		autorAtual.nome = autor.nome.trim()

		try {
			return await this.autorRepository.save(autorAtual)
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

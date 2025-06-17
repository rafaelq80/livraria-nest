import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository } from "typeorm"
import { Editora } from "../entities/editora.entity"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class EditoraService {
	private readonly logger = new Logger(EditoraService.name)

	constructor(
		@InjectRepository(Editora)
		private readonly editoraRepository: Repository<Editora>
	) {}

	async findAll(): Promise<Editora[]> {
		return await this.editoraRepository.find({
			relations: {
				produtos: true
			},
			order: {
				nome: "ASC"
			}
		})
	}

	async findById(id: number): Promise<Editora> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const editora = await this.editoraRepository.findOne({
			where: { id },
			relations: { produtos: true }
		})

		if (!editora) throw new NotFoundException(ErrorMessages.EDITORA.NOT_FOUND)

		return editora
	}

	async findAllByNome(nome: string): Promise<Editora[]> {
		return await this.editoraRepository.find({
			where: { nome: ILike(`%${nome.trim()}%`), },
			relations: {
				produtos: true
			}
		})
	}

	async findByNome(nome: string): Promise<Editora | undefined> {
		return await this.editoraRepository.findOne({
			where: { nome },
			relations: { produtos: true }
		})
	}

	async create(editora: Editora): Promise<Editora> {
		if (!editora?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.EDITORA.INVALID_DATA)
		}

		const editoraExistente = await this.findByNome(editora.nome.trim())
		if (editoraExistente) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		const novaEditora = this.editoraRepository.create({
			nome: editora.nome.trim()
		})

		try {
			return await this.editoraRepository.save(novaEditora)
		} catch (error) {
			this.logger.error('Erro ao criar editora:', error)
			throw error
		}
	}

	async update(editora: Editora): Promise<Editora> {
		if (!editora?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!editora?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.EDITORA.INVALID_DATA)
		}

		const editoraAtual = await this.findById(editora.id)

		const editoraExistente = await this.findByNome(editora.nome.trim())
		if (editoraExistente && editoraExistente.id !== editora.id) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		editoraAtual.nome = editora.nome.trim()

		try {
			return await this.editoraRepository.save(editoraAtual)
		} catch (error) {
			this.logger.error('Erro ao atualizar editora:', error)
			throw error
		}
	}

	async delete(id: number): Promise<void> {
		const result = await this.editoraRepository.delete(id)

		if (result.affected === 0) {
			throw new NotFoundException(ErrorMessages.EDITORA.NOT_FOUND)
		}
	}
}

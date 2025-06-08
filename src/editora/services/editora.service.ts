import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeleteResult, ILike, Repository } from "typeorm"
import { ErrorMessages } from "../../common/constants/error-messages"
import { Editora } from "../entities/editora.entity"

@Injectable()
export class EditoraService {
	constructor(
		@InjectRepository(Editora)
		private readonly editoraRepository: Repository<Editora>,
	) {}

	async findAll(): Promise<Editora[]> {
		return await this.editoraRepository.find({
			relations: {
				produtos: true,
			},
			order: {
				nome: 'ASC',
			},
		})
	}

	async findById(id: number): Promise<Editora> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		const editora = await this.editoraRepository.findOne({
			where: { id },
			relations: { produtos: true },
		})

		if (!editora) throw new NotFoundException(ErrorMessages.EDITORA.NOT_FOUND)

		return editora
	}

	async findAllByNome(nome: string): Promise<Editora[]> {
		return await this.editoraRepository.find({
			where: {
				nome: ILike(`%${nome.trim()}%`),
			},
			relations: {
				produtos: true,
			},
			order: {
				nome: 'ASC',
			},
		})
	}

	private async findByNome(nome: string): Promise<Editora | null> {
		return await this.editoraRepository.findOne({
			where: { nome }
		})
	}

	async create(editora: Editora): Promise<Editora> {
		if (!editora?.nome?.trim()) throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)

		const editoraExistente = await this.findByNome(editora.nome.trim())

		if (editoraExistente) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		return await this.editoraRepository.save(editora)
	}

	async update(editora: Editora): Promise<Editora> {
		if (!editora?.id || !editora?.nome?.trim()) throw new BadRequestException(ErrorMessages.CATEGORIA.INVALID_DATA)

		await this.findById(editora.id)
	
		const editoraExistente = await this.findByNome(editora.nome.trim())
			
		if (editoraExistente && editoraExistente.id !== editora.id) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		return await this.editoraRepository.save(editora)
	}

	async delete(id: number): Promise<DeleteResult> {
		if (id <= 0) throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)

		await this.findById(id)

		return await this.editoraRepository.delete(id)
	}
}

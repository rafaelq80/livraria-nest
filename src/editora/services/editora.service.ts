import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { ILike, Repository, In } from "typeorm"
import { Editora } from "../entities/editora.entity"
import { ErrorMessages } from "../../common/constants/error-messages"
import { CriarEditoraDto } from "../dtos/criareditora.dto"
import { AtualizarEditoraDto } from "../dtos/atualizareditora.dto"

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

	async findAllByIds(ids: number[]): Promise<Editora[]> {
		if (!Array.isArray(ids) || ids.length === 0) return []
		return await this.editoraRepository.find({
			where: { id: In(ids) }
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

	async create(editoraDto: CriarEditoraDto): Promise<Editora> {
		if (!editoraDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.EDITORA.INVALID_DATA)
		}

		const editoraExistente = await this.findByNome(editoraDto.nome.trim())
		if (editoraExistente) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		try {
			return await this.editoraRepository.save(editoraDto)
		} catch (error) {
			this.logger.error('Erro ao criar editora:', error)
			throw error
		}
	}

	async update(editoraDto: AtualizarEditoraDto): Promise<Editora> {
		if (!editoraDto?.id) {
			throw new BadRequestException(ErrorMessages.GENERAL.INVALID_ID)
		}

		if (!editoraDto?.nome?.trim()) {
			throw new BadRequestException(ErrorMessages.EDITORA.INVALID_DATA)
		}

		// Verificar se a editora existe
		await this.findById(editoraDto.id)

		// Verificar se já existe outra editora com o mesmo nome
		const editoraExistente = await this.findByNome(editoraDto.nome.trim())
		if (editoraExistente && editoraExistente.id !== editoraDto.id) {
			throw new BadRequestException(ErrorMessages.EDITORA.ALREADY_EXISTS)
		}

		try {
			return await this.editoraRepository.save(editoraDto)
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

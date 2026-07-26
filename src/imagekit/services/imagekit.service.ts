import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { HttpService } from "@nestjs/axios"
import { lastValueFrom } from "rxjs"
import { createCanvas, loadImage } from "canvas"
import { ImagekitDto, ImagekitResponse, BaseImageUpload } from "../dto"
import { ErrorMessages } from "../../common/constants/error-messages"
import { ImageValidationService } from "./image-validation.service"

@Injectable()
export class ImageKitService {
	private readonly logger = new Logger(ImageKitService.name)
	private readonly imageKitUrl: string
	private readonly imageKitPrivateKey: string
	private readonly imageKitDeleteUrl: string
	private readonly uploadTimeout: number
	private readonly deleteTimeout: number
	private readonly compressionQuality: number

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
		private readonly imageValidationService: ImageValidationService,
	) {
		this.imageKitUrl = this.configService.get<string>("imagekit.urlEndpoint")
		this.imageKitPrivateKey = this.configService.get<string>("imagekit.privateKey")
		this.imageKitDeleteUrl = this.configService.get<string>("imagekit.urlDelete")
		this.uploadTimeout = this.configService.get<number>("imagekit.uploadTimeout")
		this.deleteTimeout = this.configService.get<number>("imagekit.deleteTimeout")
		this.compressionQuality = this.configService.get<number>("imagekit.compressionQuality")
		
		this.validateConfiguration()
	}

	private validateConfiguration(): void {
		if (!this.imageKitUrl || !this.imageKitPrivateKey || !this.imageKitDeleteUrl) {
			throw new Error("Configuração do ImageKit incompleta")
		}
	}

	async handleImage(imagekitDto: ImagekitDto | BaseImageUpload): Promise<string | undefined> {
		if (!imagekitDto?.file) {
			return undefined
		}

		try {
			// Deleta imagem antiga se existir
			if ('oldImageUrl' in imagekitDto && imagekitDto.oldImageUrl) {
				await this.deleteOldImage(imagekitDto.oldImageUrl)
			}

			const imageBuffer = await this.getImageBuffer(imagekitDto.file)
			if (!imageBuffer) {
				throw new BadRequestException("Não foi possível processar o arquivo de imagem")
			}

			if (!imagekitDto.recurso || !imagekitDto.identificador) {
				throw new BadRequestException("Recurso ou identificador não fornecidos")
			}

			const file = this.createFileObject(
				imageBuffer,
				imagekitDto.recurso,
				imagekitDto.identificador,
				imagekitDto.file.mimetype,
				imagekitDto.file.originalname,
			)

			const result = await this.uploadImage(file, `uploads/livraria/${imagekitDto.recurso}`)
			
			this.logger.log(`Upload concluído: ${imagekitDto.recurso}/${imagekitDto.identificador}`)
			return result
		} catch (error) {
			this.logger.error(`Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
		}
	}

	private async deleteOldImage(oldImageUrl?: string): Promise<void> {
		if (!oldImageUrl || typeof oldImageUrl !== 'string') {
			return
		}

		try {
			const imageName = oldImageUrl.split("/").pop()
			if (!imageName) return

			const imageId = await this.getImageId(imageName)
			if (imageId) {
				await this.deleteImage(imageId)
				this.logger.log(`Imagem antiga deletada: ${imageName}`)
			}
		} catch (error) {
			this.logger.warn(`Erro ao deletar imagem antiga: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			// Não propaga erro - falha na deleção não deve bloquear o upload
		}
	}

	private async getImageBuffer(image: Express.Multer.File | string): Promise<Buffer | undefined> {
		try {
			if (typeof image === "string" && image.startsWith("http")) {
				return await this.downloadImage(image)
			}
			
			if (typeof image !== "string" && image?.buffer) {
				return image.buffer
			}
			
			return undefined
		} catch (error) {
			this.logger.error(`Erro ao obter buffer: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			return undefined
		}
	}

	private createFileObject(
		buffer: Buffer,
		recurso: string,
		identificador: string,
		originalMimeType: string = 'image/jpeg',
		originalFileName?: string,
	): Express.Multer.File {
		if (!buffer || !recurso || !identificador) {
			throw new Error("Parâmetros obrigatórios não fornecidos")
		}

		const timestamp = Date.now()
		const extension = this.getFileExtension(originalMimeType, originalFileName)
		const filename = `${recurso}_${identificador}_${timestamp}.${extension}`
		
		return {
			buffer,
			originalname: filename,
			fieldname: "file",
			encoding: "7bit",
			mimetype: originalMimeType,
			size: buffer.length,
			stream: null,
			destination: "",
			filename,
			path: "",
		}
	}

	private getFileExtension(mimeType: string, originalFileName?: string): string {
		// Tenta extrair extensão do nome original
		if (originalFileName) {
			const ext = originalFileName.split('.').pop()?.toLowerCase()
			if (ext && ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic'].includes(ext)) {
				return ext
			}
		}

		// Mapeia MIME type para extensão
		const mimeToExt: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/png': 'png',
			'image/webp': 'webp',
			'image/avif': 'avif',
			'image/heic': 'heic',
		}

		return mimeToExt[mimeType] || 'jpg'
	}

	private async uploadImage(image: Express.Multer.File, folder: string): Promise<string> {
		if (!image) {
			throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED)
		}

		// Validação básica
		const basicValidation = this.imageValidationService.validateImageBasic(image)
		if (!basicValidation.isValid) {
			throw new BadRequestException(`Validação falhou: ${basicValidation.errors.join(', ')}`)
		}

		let processedBuffer: Buffer

		// Formatos modernos: ImageKit processa
		// Formatos tradicionais: Canvas processa
		if (this.isModernImageFormat(image.mimetype)) {
			this.logger.log(`Formato moderno detectado (${image.mimetype}): ImageKit processará`)
			processedBuffer = image.buffer
		} else {
			this.logger.log(`Formato tradicional (${image.mimetype}): processando com Canvas`)
			
			const validationResult = await this.imageValidationService.validateImage(image)
			if (!validationResult.isValid) {
				throw new BadRequestException(`Validação falhou: ${validationResult.errors.join(', ')}`)
			}

			processedBuffer = await this.processImage(image.buffer)
		}

		const form = this.createFormData(processedBuffer, image.originalname, folder, image.mimetype)
		return await this.postImage(form)
	}

	private isModernImageFormat(mimetype: string): boolean {
		return ['image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(mimetype)
	}

	private createFormData(buffer: Buffer, filename: string, folder: string, mimeType: string): FormData {
		if (!buffer || buffer.length === 0) {
			throw new Error("Buffer vazio")
		}
		
		if (!filename) {
			throw new Error("Nome do arquivo não fornecido")
		}

		const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
		const form = new FormData()
		form.append("file", blob, filename)
		form.append("fileName", filename)
		form.append("folder", folder || "uploads/livraria/default")
		
		return form
	}

	private async postImage(form: FormData): Promise<string> {
		try {
			const response = await lastValueFrom(
				this.httpService.post<ImagekitResponse>(this.imageKitUrl, form, {
					headers: this.getAuthHeaders(),
					timeout: this.uploadTimeout,
				}),
			)

			if (!response.data?.url) {
				throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
			}

			return response.data.url
		} catch (error) {
			this.logger.error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
		}
	}

	private async deleteImage(imageId: string): Promise<void> {
		if (!imageId) return

		const deleteUrl = `${this.imageKitDeleteUrl}/${imageId}`

		try {
			await lastValueFrom(
				this.httpService.delete(deleteUrl, {
					headers: this.getAuthHeaders(),
					timeout: this.deleteTimeout,
				}),
			)
		} catch (error) {
			this.logger.error(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
		}
	}

	private async getImageId(imageName: string): Promise<string | null> {
		if (!imageName) return null

		const url = `${this.imageKitDeleteUrl}?name=${encodeURIComponent(imageName)}`

		try {
			const response = await lastValueFrom(
				this.httpService.get<ImagekitResponse[]>(url, {
					headers: this.getAuthHeaders(),
					timeout: this.deleteTimeout,
				}),
			)

			if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].fileId) {
				return response.data[0].fileId
			}

			return null
		} catch (error) {
			this.logger.error(`Erro ao buscar ID: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			return null
		}
	}

	private async processImage(buffer: Buffer): Promise<Buffer> {
		if (!buffer || buffer.length === 0) {
			throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED)
		}

		try {
			const image = await loadImage(buffer)
			const canvas = createCanvas(image.width, image.height)
			const ctx = canvas.getContext("2d")
			ctx.drawImage(image, 0, 0)
			return canvas.toBuffer("image/jpeg", { quality: this.compressionQuality })
		} catch (error) {
			this.logger.error(`Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
		}
	}

	private async downloadImage(url: string): Promise<Buffer> {
		if (!url || typeof url !== 'string') {
			throw new BadRequestException(ErrorMessages.IMAGE.INVALID_URL)
		}

		try {
			const response = await lastValueFrom(
				this.httpService.get(url, { 
					responseType: "arraybuffer",
					timeout: this.uploadTimeout,
				}),
			)

			if (!response.data) {
				throw new BadRequestException(ErrorMessages.IMAGE.DOWNLOAD_ERROR)
			}

			return Buffer.from(response.data)
		} catch (error) {
			this.logger.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
			throw new BadRequestException(ErrorMessages.IMAGE.DOWNLOAD_ERROR)
		}
	}

	private getAuthHeaders() {
		if (!this.imageKitPrivateKey) {
			throw new BadRequestException("Chave privada do ImageKit não configurada")
		}

		const credentials = `${this.imageKitPrivateKey}:`
		const encodedCredentials = Buffer.from(credentials).toString("base64")

		return {
			Authorization: `Basic ${encodedCredentials}`,
			'Content-Type': 'multipart/form-data',
		}
	}

	// Métodos utilitários públicos

	async processarUsuarioImage(
		userId: number,
		file: Express.Multer.File,
		oldImageUrl?: string
	): Promise<string | undefined> {
		return this.handleImage({
			file,
			recurso: "usuario",
			identificador: userId.toString(),
			oldImageUrl
		})
	}

	async processarProdutoImage(
		productId: number,
		file: Express.Multer.File,
		oldImageUrl?: string
	): Promise<string | undefined> {
		return this.handleImage({
			file,
			recurso: "produto",
			identificador: productId.toString(),
			oldImageUrl
		})
	}

	async processarAutorImage(
		authorId: number,
		file: Express.Multer.File,
		oldImageUrl?: string
	): Promise<string | undefined> {
		return this.handleImage({
			file,
			recurso: "autor",
			identificador: authorId.toString(),
			oldImageUrl
		})
	}

	async processarEditoraImage(
		publisherId: number,
		file: Express.Multer.File,
		oldImageUrl?: string
	): Promise<string | undefined> {
		return this.handleImage({
			file,
			recurso: "editora",
			identificador: publisherId.toString(),
			oldImageUrl
		})
	}

	async deleteImageByUrl(imageUrl: string): Promise<void> {
		if (!imageUrl) return
		await this.deleteOldImage(imageUrl)
	}

	isImageKitUrl(url: string): boolean {
		return !!(url && typeof url === 'string' && url.includes('imagekit.io'))
	}

	getConfig() {
		return {
			urlEndpoint: this.imageKitUrl,
			urlDelete: this.imageKitDeleteUrl,
			uploadTimeout: this.uploadTimeout,
			deleteTimeout: this.deleteTimeout,
			compressionQuality: this.compressionQuality,
			validation: this.imageValidationService.getConfig(),
		}
	}
}
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { HttpService } from "@nestjs/axios"
import { lastValueFrom } from "rxjs"
import { createCanvas, loadImage } from "canvas"
import { ImagekitDto } from "../dto/imagekit.dto"
import { ImagekitResponse } from "../types/imagekitresponse"
import { ErrorMessages } from "../../common/constants/error-messages"

@Injectable()
export class ImageKitService {
	private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
	private readonly ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
	private readonly imageKitUrl: string
	private readonly imageKitPrivateKey: string

	constructor(
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {
		this.imageKitUrl = this.configService.get<string>("IMAGEKIT_URL_ENDPOINT")
		this.imageKitPrivateKey = this.configService.get<string>("IMAGEKIT_PRIVATE_KEY")
		
		// Validar se as configurações necessárias existem
		if (!this.imageKitUrl) {
			throw new Error("IMAGEKIT_URL_ENDPOINT não configurado")
		}
		if (!this.imageKitPrivateKey) {
			throw new Error("IMAGEKIT_PRIVATE_KEY não configurado")
		}
	}

	async handleImage(imagekitDto: ImagekitDto): Promise<string | undefined> {
		// Validar se o DTO está correto
		if (!imagekitDto) {
			console.error("ImagekitDto é undefined ou null")
			return undefined
		}

		if (!imagekitDto.file) {
			console.log("Nenhum arquivo fornecido para upload")
			return undefined
		}

		try {
			// Deletar imagem antiga se existir
			if (imagekitDto.oldImageUrl) {
				await this.deleteOldImage(imagekitDto.oldImageUrl)
			}

			const imageBuffer = await this.getImageBuffer(imagekitDto.file)
			if (!imageBuffer) {
				console.error("Não foi possível obter o buffer da imagem")
				return undefined
			}

			// Validar se recurso e identificador existem
			if (!imagekitDto.recurso || !imagekitDto.identificador) {
				console.error("Recurso ou identificador não fornecidos:", {
					recurso: imagekitDto.recurso,
					identificador: imagekitDto.identificador
				})
				return undefined
			}

			const file = this.createFileObject(
				imageBuffer,
				imagekitDto.recurso,
				imagekitDto.identificador,
			)

			return await this.uploadImage(file, `uploads/livraria/${imagekitDto.recurso}`)
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			throw new HttpException(
				"Erro interno ao processar imagem",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private async deleteOldImage(oldImageUrl?: string): Promise<void> {
		if (!oldImageUrl || typeof oldImageUrl !== 'string') return

		try {
			const imageName = oldImageUrl.split("/").pop()
			if (!imageName) {
				console.warn("Não foi possível extrair o nome da imagem da URL:", oldImageUrl)
				return
			}

			const imageId = await this.getImageId(imageName)
			if (imageId) {
				await this.deleteImage(imageId)
			}
		} catch (error) {
			console.error("Erro ao deletar imagem antiga:", error)
			// Não propagar o erro, pois a falha em deletar a imagem antiga não deve impedir o upload da nova
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
			
			console.error("Formato de imagem inválido:", typeof image)
			return undefined
		} catch (error) {
			console.error("Erro ao obter buffer da imagem:", error)
			return undefined
		}
	}

	private createFileObject(
		buffer: Buffer,
		recurso: string,
		identificador: string,
	): Express.Multer.File {
		if (!buffer || !recurso || !identificador) {
			throw new Error("Parâmetros obrigatórios não fornecidos para criação do arquivo")
		}

		const timestamp = Date.now()
		const filename = `${recurso}_${identificador}_${timestamp}.jpg`
		
		return {
			buffer,
			originalname: filename,
			fieldname: "file",
			encoding: "7bit",
			mimetype: "image/jpeg",
			size: buffer.length,
			stream: null,
			destination: "",
			filename,
			path: "",
		}
	}

	private async uploadImage(image: Express.Multer.File, folder: string): Promise<string> {
		if (!image) {
			throw new HttpException(ErrorMessages.IMAGE.NOT_PROVIDED, HttpStatus.BAD_REQUEST)
		}

		this.validateImage(image)
		const processedBuffer = await this.processImage(image.buffer)
		const form = this.createFormData(processedBuffer, image.originalname, folder)
		return await this.postImage(form)
	}

	private validateImage(image: Express.Multer.File): void {
		if (!image) {
			throw new HttpException(ErrorMessages.IMAGE.NOT_PROVIDED, HttpStatus.BAD_REQUEST)
		}

		if (!image.mimetype || !this.ALLOWED_TYPES.includes(image.mimetype)) {
			throw new HttpException(
				`${ErrorMessages.IMAGE.INVALID_FORMAT} Formatos permitidos: ${this.ALLOWED_TYPES.join(", ")}`,
				HttpStatus.BAD_REQUEST,
			)
		}

		if (!image.size || image.size > this.MAX_FILE_SIZE) {
			throw new HttpException(
				ErrorMessages.IMAGE.SIZE_EXCEEDED,
				HttpStatus.BAD_REQUEST,
			)
		}
	}

	private createFormData(buffer: Buffer, filename: string, folder: string): FormData {
		if (!buffer || buffer.length === 0) {
			throw new Error("Buffer da imagem está vazio")
		}
		
		if (!filename) {
			throw new Error("Nome do arquivo não fornecido")
		}

		// Convert Node.js Buffer to Uint8Array for Blob compatibility
		const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" })
		const form = new FormData()
		form.append("file", blob, filename)
		form.append("fileName", filename)
		form.append("folder", folder || "uploads/livraria/default")
		return form
	}

	private async postImage(form: FormData): Promise<string> {
		if (!form) {
			throw new Error("FormData não fornecido")
		}

		try {
			const response = await lastValueFrom(
				this.httpService.post<ImagekitResponse>(this.imageKitUrl, form, {
					headers: this.getAuthHeaders(),
					timeout: 30000, // 30 segundos de timeout
				}),
			)

			if (!response?.data?.url) {
				throw new Error("URL da imagem não retornada pelo ImageKit")
			}

			return response.data.url
		} catch (error) {
			console.error("Erro ao fazer upload da imagem:", error)
			
			if (error.response) {
				console.error("Resposta do erro:", error.response.status, error.response.data)
			}
			
			throw new HttpException(
				"Erro ao fazer upload da imagem para o ImageKit",
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private async deleteImage(imageId: string): Promise<void> {
		if (!imageId) {
			console.warn("ID da imagem não fornecido para deleção")
			return
		}

		const deleteUrl = `${this.configService.get<string>("IMAGEKIT_URL_DELETE")}/${imageId}`

		try {
			const response = await lastValueFrom(
				this.httpService.delete(deleteUrl, {
					headers: this.getAuthHeaders(),
					timeout: 10000, // 10 segundos de timeout
				}),
			)
			console.log("Imagem deletada com sucesso:", response.status, response.statusText)
		} catch (error) {
			console.error("Erro ao deletar arquivo:", error.response?.data ?? error.message)
			// Não propagar o erro para não interromper o fluxo principal
		}
	}

	private async getImageId(imageName: string): Promise<string | null> {
		if (!imageName) {
			console.warn("Nome da imagem não fornecido")
			return null
		}

		const url = `${this.configService.get<string>("IMAGEKIT_URL_DELETE")}?name=${encodeURIComponent(imageName)}`

		try {
			const response = await lastValueFrom(
				this.httpService.get<ImagekitResponse[]>(url, {
					headers: this.getAuthHeaders(),
					timeout: 10000, // 10 segundos de timeout
				}),
			)

			if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].fileId) {
				return response.data[0].fileId
			}

			return null
		} catch (error) {
			console.error("Erro ao buscar ID da imagem:", error)
			return null
		}
	}

	private async processImage(buffer: Buffer): Promise<Buffer> {
		if (!buffer || buffer.length === 0) {
			throw new HttpException("Buffer da imagem está vazio", HttpStatus.BAD_REQUEST)
		}

		try {
			const image = await loadImage(buffer)

			if (!image || !image.width || !image.height) {
				throw new Error("Imagem inválida ou corrompida")
			}

			// Calculate new dimensions while maintaining aspect ratio
			let width = image.width
			let height = image.height
			const maxDimension = 800

			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = Math.round((height * maxDimension) / width)
					width = maxDimension
				} else {
					width = Math.round((width * maxDimension) / height)
					height = maxDimension
				}
			}

			// Garantir dimensões mínimas
			width = Math.max(width, 1)
			height = Math.max(height, 1)

			const canvas = createCanvas(width, height)
			const ctx = canvas.getContext("2d")

			if (!ctx) {
				throw new Error("Não foi possível criar contexto do canvas")
			}

			// Use only imageSmoothingEnabled
			ctx.imageSmoothingEnabled = true

			// Draw image with resize
			ctx.drawImage(image, 0, 0, width, height)

			// Convert to buffer with JPEG encoding
			const processedBuffer = canvas.toBuffer("image/jpeg", {
				quality: 0.8,
				progressive: true,
			})

			if (!processedBuffer || processedBuffer.length === 0) {
				throw new Error("Falha ao gerar buffer da imagem processada")
			}

			return processedBuffer
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			throw new HttpException(
				`Erro ao processar a imagem: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private async downloadImage(url: string): Promise<Buffer> {
		if (!url || typeof url !== 'string') {
			throw new HttpException(ErrorMessages.IMAGE.INVALID_URL, HttpStatus.BAD_REQUEST)
		}

		try {
			const response = await lastValueFrom(
				this.httpService.get(url, { 
					responseType: "arraybuffer",
					timeout: 30000, // 30 segundos de timeout
				}),
			)

			if (!response.data) {
				throw new Error("Resposta vazia ao baixar imagem")
			}

			return Buffer.from(response.data)
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.error("Erro ao baixar imagem:", errorMessage)
			throw new HttpException(
				`${ErrorMessages.IMAGE.DOWNLOAD_ERROR} ${errorMessage}`,
				HttpStatus.BAD_REQUEST
			)
		}
	}

	private getAuthHeaders() {
		if (!this.imageKitPrivateKey) {
			throw new Error("Chave privada do ImageKit não configurada")
		}

		const credentials = `${this.imageKitPrivateKey}:`
		const encodedCredentials = Buffer.from(credentials).toString("base64")

		return {
			Authorization: `Basic ${encodedCredentials}`,
			'Content-Type': 'multipart/form-data',
		}
	}
}
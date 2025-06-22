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
		
		// Validar configuração na inicialização
		this.validateConfiguration()
	}

	private validateConfiguration(): void {
		if (!this.imageKitUrl) {
			throw new Error("IMAGEKIT_URL_ENDPOINT não configurado")
		}
		if (!this.imageKitPrivateKey) {
			throw new Error("IMAGEKIT_PRIVATE_KEY não configurado")
		}
		if (!this.imageKitDeleteUrl) {
			throw new Error("IMAGEKIT_URL_DELETE não configurado")
		}
	}

	async handleImage(imagekitDto: ImagekitDto | BaseImageUpload): Promise<string | undefined> {
		if (!imagekitDto?.file) {
			this.logger.warn("Nenhum arquivo fornecido para upload", {
				recurso: imagekitDto?.recurso,
				identificador: imagekitDto?.identificador
			});
			return undefined;
		}

		try {
			this.logger.log("Iniciando processamento de imagem", {
				recurso: imagekitDto.recurso,
				identificador: imagekitDto.identificador,
				fileName: imagekitDto.file.originalname,
				fileSize: imagekitDto.file.size,
				hasOldImage: 'oldImageUrl' in imagekitDto && !!imagekitDto.oldImageUrl,
			});

			// Deletar imagem antiga se existir
			if ('oldImageUrl' in imagekitDto && imagekitDto.oldImageUrl) {
				this.logger.log("Deletando imagem antiga", { oldImageUrl: imagekitDto.oldImageUrl });
				await this.deleteOldImage(imagekitDto.oldImageUrl);
			}

			const imageBuffer = await this.getImageBuffer(imagekitDto.file);
			if (!imageBuffer) {
				this.logger.error("Não foi possível obter o buffer da imagem", {
					fileName: imagekitDto.file.originalname,
					fileSize: imagekitDto.file.size,
					mimeType: imagekitDto.file.mimetype
				});
				return undefined;
			}

			// Validar se recurso e identificador existem
			if (!imagekitDto.recurso || !imagekitDto.identificador) {
				this.logger.error("Recurso ou identificador não fornecidos", {
					recurso: imagekitDto.recurso,
					identificador: imagekitDto.identificador,
					fileName: imagekitDto.file.originalname
				});
				return undefined;
			}

			const file = this.createFileObject(
				imageBuffer,
				imagekitDto.recurso,
				imagekitDto.identificador,
			);

			this.logger.log("Arquivo criado com sucesso", {
				fileName: file.filename,
				bufferSize: file.size,
				folder: `uploads/livraria/${imagekitDto.recurso}`
			});

			const result = await this.uploadImage(file, `uploads/livraria/${imagekitDto.recurso}`);
			
			this.logger.log("Upload concluído com sucesso", {
				url: result,
				recurso: imagekitDto.recurso,
				identificador: imagekitDto.identificador
			});

			return result;
		} catch (error) {
			this.logger.error("Erro ao processar imagem", {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				recurso: imagekitDto.recurso,
				identificador: imagekitDto.identificador,
				fileName: imagekitDto.file?.originalname
			});
			throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED);
		}
	}

	private async deleteOldImage(oldImageUrl?: string): Promise<void> {
		if (!oldImageUrl || typeof oldImageUrl !== 'string') {
			this.logger.debug("URL da imagem antiga inválida ou não fornecida", { oldImageUrl });
			return;
		}

		try {
			this.logger.log("Iniciando deleção de imagem antiga", { oldImageUrl });
			
			const imageName = oldImageUrl.split("/").pop();
			if (!imageName) {
				this.logger.warn("Não foi possível extrair o nome da imagem da URL", { oldImageUrl });
				return;
			}

			this.logger.debug("Buscando ID da imagem para deleção", { imageName });
			const imageId = await this.getImageId(imageName);
			
			if (imageId) {
				this.logger.log("Deletando imagem antiga", { imageId, imageName });
				await this.deleteImage(imageId);
				this.logger.log("Imagem antiga deletada com sucesso", { imageId, imageName });
			} else {
				this.logger.warn("ID da imagem não encontrado, não foi possível deletar", { imageName, oldImageUrl });
			}
		} catch (error) {
			this.logger.error("Erro ao deletar imagem antiga", {
				error: error instanceof Error ? error.message : String(error),
				oldImageUrl,
				imageName: oldImageUrl.split("/").pop()
			});
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
			
			this.logger.error("Formato de imagem inválido:", typeof image)
			return undefined
		} catch (error) {
			this.logger.error("Erro ao obter buffer da imagem:", error)
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
			throw new BadRequestException(ErrorMessages.IMAGE.NOT_PROVIDED)
		}

		// Validação robusta da imagem
		const validationResult = await this.imageValidationService.validateImage(image)
		if (!validationResult.isValid) {
			throw new BadRequestException(
				`Validação de imagem falhou: ${validationResult.errors.join(', ')}`
			)
		}

		this.logger.log(`Imagem validada: ${validationResult.width}x${validationResult.height}, ${validationResult.fileSize} bytes`)

		const processedBuffer = await this.processImage(image.buffer)
		const form = this.createFormData(processedBuffer, image.originalname, folder)
		return await this.postImage(form)
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

			this.logger.log(`Upload realizado com sucesso: ${response.data.url}`)
			return response.data.url
		} catch (error) {
			this.logger.error("Erro ao fazer upload da imagem:", error)
			throw new BadRequestException(ErrorMessages.IMAGE.UPLOAD_FAILED)
		}
	}

	private async deleteImage(imageId: string): Promise<void> {
		if (!imageId) {
			this.logger.warn("ID da imagem não fornecido para deleção")
			return
		}

		const deleteUrl = `${this.imageKitDeleteUrl}/${imageId}`

		try {
			const response = await lastValueFrom(
				this.httpService.delete(deleteUrl, {
					headers: this.getAuthHeaders(),
					timeout: this.deleteTimeout,
				}),
			)
			this.logger.log("Imagem deletada com sucesso:", response.status, response.statusText)
		} catch (error) {
			this.logger.error("Erro ao deletar arquivo:", error.response?.data ?? error.message)
			// Não propagar o erro para não interromper o fluxo principal
		}
	}

	private async getImageId(imageName: string): Promise<string | null> {
		if (!imageName) {
			this.logger.warn("Nome da imagem não fornecido")
			return null
		}

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
			this.logger.error("Erro ao buscar ID da imagem:", error)
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
			this.logger.error("Erro ao processar imagem:", error)
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
		} catch (error: unknown) {
			let errorMessage: string;
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'object' && error !== null) {
				try {
					errorMessage = JSON.stringify(error);
				} catch {
					errorMessage = '[Non-serializable error object]';
				}
			} else {
				errorMessage = '[Unknown error type]';
			}
			this.logger.error("Erro ao baixar imagem:", errorMessage)
			throw new BadRequestException(ErrorMessages.IMAGE.DOWNLOAD_ERROR)
		}
	}

	private getAuthHeaders() {
		if (!this.imageKitPrivateKey) {
			throw new BadRequestException(ErrorMessages.IMAGE.INVALID_URL)
		}

		const credentials = `${this.imageKitPrivateKey}:`
		const encodedCredentials = Buffer.from(credentials).toString("base64")

		return {
			Authorization: `Basic ${encodedCredentials}`,
			'Content-Type': 'multipart/form-data',
		}
	}

	/**
	 * Método utilitário para processar imagem de usuário
	 */
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

	/**
	 * Método utilitário para processar imagem de produto
	 */
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

	/**
	 * Método utilitário para processar imagem de autor
	 */
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

	/**
	 * Método utilitário para processar imagem de editora
	 */
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

	/**
	 * Método para deletar imagem por URL
	 */
	async deleteImageByUrl(imageUrl: string): Promise<void> {
		if (!imageUrl) return
		await this.deleteOldImage(imageUrl)
	}

	/**
	 * Método para validar se uma URL é do ImageKit
	 */
	isImageKitUrl(url: string): boolean {
		return !!(url && typeof url === 'string' && url.includes('imagekit.io'))
	}

	/**
	 * Obtém configuração atual do ImageKit
	 */
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
export class ImagekitDto {
	readonly file: Express.Multer.File
	readonly usuarioId: number
	readonly recurso: string
	readonly oldImageUrl?: string
}

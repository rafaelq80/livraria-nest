export class ImagekitDto {
	readonly file: Express.Multer.File
	readonly usuario: string
	readonly recurso: string
	readonly oldImageUrl?: string
}

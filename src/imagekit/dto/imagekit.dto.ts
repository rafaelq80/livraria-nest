export class ImagekitDto {
	readonly file: Express.Multer.File
	readonly identificador: string
	readonly recurso: string
	readonly oldImageUrl?: string
}

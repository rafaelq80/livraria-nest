// Interface base para upload de imagem
export interface BaseImageUpload {
  file: Express.Multer.File;
  recurso: string;
  identificador: string;
} 
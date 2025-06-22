// Exportações centralizadas dos DTOs do ImageKit

// Interface base
export { BaseImageUpload } from './base-image-upload.interface';

// DTOs base
export { ImageUploadDto } from './image-upload.dto';
export { ImagekitDto } from './imagekit.dto';

// DTOs específicos por recurso
export { UsuarioImageDto } from './usuario-image.dto';
export { ProdutoImageDto } from './produto-image.dto';
export { AutorImageDto } from './autor-image.dto';
export { EditoraImageDto } from './editora-image.dto';

// Interface de resposta
export { ImagekitResponse } from './imagekit.dto';

// Funções utilitárias
export { createImagekitDto, validateImageFile } from './imagekit.dto'; 
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ImageKitService } from './imagekit.service';
import { ImageValidationService } from './image-validation.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import { ImagekitDto } from '../dto';

describe('ImageKitService', () => {
  let service: ImageKitService;
  let configService: ConfigService;
  let httpService: HttpService;
  let imageValidationService: ImageValidationService;

  // Buffer de imagem JPEG válido para testes
  const createValidImageBuffer = (): Buffer => {
    // Cria um buffer que simula uma imagem JPEG válida
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00
    ]);
    const jpegFooter = Buffer.from([0xFF, 0xD9]);
    return Buffer.concat([jpegHeader, Buffer.alloc(100), jpegFooter]);
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'imagekit.urlEndpoint':
          return 'https://upload.imagekit.io/api/v1/files/upload';
        case 'imagekit.privateKey':
          return 'test-private-key';
        case 'imagekit.urlDelete':
          return 'https://api.imagekit.io/v1/files';
        case 'imagekit.uploadTimeout':
          return 30000;
        case 'imagekit.deleteTimeout':
          return 10000;
        case 'imagekit.compressionQuality':
          return 0.8;
        default:
          return null;
      }
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const mockImageValidationService = {
    validateImage: jest.fn().mockResolvedValue({
      isValid: true,
      width: 800,
      height: 600,
      aspectRatio: 1.33,
      fileSize: 1024,
      mimeType: 'image/jpeg',
      errors: [],
    }),
    validateImageBasic: jest.fn().mockReturnValue({
      isValid: true,
      width: 0,
      height: 0,
      aspectRatio: 0,
      fileSize: 1024,
      mimeType: 'image/jpeg',
      errors: [],
    }),
    getConfig: jest.fn().mockReturnValue({
      maxFileSize: 5242880,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      minWidth: 100,
      maxWidth: 4000,
      minHeight: 100,
      maxHeight: 4000,
      minAspectRatio: 0.5,
      maxAspectRatio: 2.0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageKitService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ImageValidationService,
          useValue: mockImageValidationService,
        },
      ],
    }).compile();

    service = module.get<ImageKitService>(ImageKitService);
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
    imageValidationService = module.get<ImageValidationService>(ImageValidationService);

    // MOCK do processImage para não depender de buffer real
    Object.defineProperty(service, 'processImage', {
      value: jest.fn().mockResolvedValue(Buffer.from('mock')),
      writable: true,
    });

    // Reduzir nível de log durante testes para reduzir ruído
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'debug').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('validarConfiguracao', () => {
    it('deve lançar erro quando IMAGEKIT_URL_ENDPOINT não está configurado', () => {
      mockConfigService.get.mockReturnValueOnce(null);
      
      expect(() => {
        return new ImageKitService(configService, httpService, imageValidationService);
      }).toThrow('IMAGEKIT_URL_ENDPOINT não configurado');
    });

    it('deve lançar erro quando IMAGEKIT_PRIVATE_KEY não está configurado', () => {
      mockConfigService.get
        .mockReturnValueOnce('https://upload.imagekit.io/api/v1/files/upload')
        .mockReturnValueOnce(null);
      
      expect(() => {
        return new ImageKitService(configService, httpService, imageValidationService);
      }).toThrow('IMAGEKIT_PRIVATE_KEY não configurado');
    });
  });

  describe('processarImagem', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: createValidImageBuffer(),
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '',
    };

    it('deve retornar undefined quando nenhum arquivo é fornecido', async () => {
      const result = await service.handleImage({} as ImagekitDto);
      expect(result).toBeUndefined();
    });

    it('deve processar imagem com sucesso', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/image.jpg',
          fileId: 'test-id',
          name: 'test.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.handleImage({
        file: mockFile,
        recurso: 'produto',
        identificador: '123',
      });

      expect(result).toBe('https://example.com/image.jpg');
    });

    it('deve lançar erro quando upload falha', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Upload failed')));

      await expect(
        service.handleImage({
          file: mockFile,
          recurso: 'produto',
          identificador: '123',
        })
      ).rejects.toThrow(ErrorMessages.IMAGE.UPLOAD_FAILED);
    });

    it('deve lançar erro quando validação de imagem falha', async () => {
      mockImageValidationService.validateImage.mockResolvedValueOnce({
        isValid: false,
        width: 0,
        height: 0,
        aspectRatio: 0,
        fileSize: 1024,
        mimeType: 'image/jpeg',
        errors: ['Tamanho máximo permitido: 5MB', 'Largura mínima: 100px'],
      });

      await expect(
        service.handleImage({
          file: mockFile,
          recurso: 'produto',
          identificador: '123',
        })
      ).rejects.toThrow(ErrorMessages.IMAGE.UPLOAD_FAILED);
    });

    it('deve lançar erro quando processImage falha', async () => {
      Object.defineProperty(service, 'processImage', {
        value: jest.fn().mockRejectedValue(new Error('Process failed')),
        writable: true,
      });

      await expect(
        service.handleImage({
          file: mockFile,
          recurso: 'produto',
          identificador: '123',
        })
      ).rejects.toThrow(ErrorMessages.IMAGE.UPLOAD_FAILED);
    });

    it('deve retornar undefined quando recurso está ausente', async () => {
      const result = await service.handleImage({
        file: mockFile,
        identificador: '123',
      } as ImagekitDto);

      expect(result).toBeUndefined();
    });

    it('deve retornar undefined quando identificador está ausente', async () => {
      const result = await service.handleImage({
        file: mockFile,
        recurso: 'produto',
      } as ImagekitDto);

      expect(result).toBeUndefined();
    });

    it('deve deletar imagem antiga quando oldImageUrl é fornecido', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/image.jpg',
          fileId: 'test-id',
          name: 'test.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockHttpService.get.mockReturnValue(of({ data: [{ fileId: 'old-id' }] }));
      mockHttpService.delete.mockReturnValue(of({ status: 200 }));

      const result = await service.handleImage({
        file: mockFile,
        recurso: 'produto',
        identificador: '123',
        oldImageUrl: 'https://imagekit.io/old-image.jpg',
      });

      expect(result).toBe('https://example.com/image.jpg');
      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockHttpService.delete).toHaveBeenCalled();
    });
  });

  describe('processarImagemUsuario', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'user.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: createValidImageBuffer(),
      stream: null,
      destination: '',
      filename: 'user.jpg',
      path: '',
    };

    it('deve processar imagem de usuário com sucesso', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/user.jpg',
          fileId: 'user-id',
          name: 'user.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.processarUsuarioImage(1, mockFile);

      expect(result).toBe('https://example.com/user.jpg');
    });
  });

  describe('processarImagemProduto', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'product.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: createValidImageBuffer(),
      stream: null,
      destination: '',
      filename: 'product.jpg',
      path: '',
    };

    it('deve processar imagem de produto com sucesso', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/product.jpg',
          fileId: 'product-id',
          name: 'product.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.processarProdutoImage(1, mockFile);

      expect(result).toBe('https://example.com/product.jpg');
    });
  });

  describe('processarImagemAutor', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'author.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: createValidImageBuffer(),
      stream: null,
      destination: '',
      filename: 'author.jpg',
      path: '',
    };

    it('deve processar imagem de autor com sucesso', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/author.jpg',
          fileId: 'author-id',
          name: 'author.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.processarAutorImage(1, mockFile);

      expect(result).toBe('https://example.com/author.jpg');
    });

    it('deve processar imagem de autor com URL de imagem antiga', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/author.jpg',
          fileId: 'author-id',
          name: 'author.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockHttpService.get.mockReturnValue(of({ data: [{ fileId: 'old-author-id' }] }));
      mockHttpService.delete.mockReturnValue(of({ status: 200 }));

      const result = await service.processarAutorImage(1, mockFile, 'https://imagekit.io/old-author.jpg');

      expect(result).toBe('https://example.com/author.jpg');
      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockHttpService.delete).toHaveBeenCalled();
    });
  });

  describe('processarImagemEditora', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'publisher.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: createValidImageBuffer(),
      stream: null,
      destination: '',
      filename: 'publisher.jpg',
      path: '',
    };

    it('deve processar imagem de editora com sucesso', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/publisher.jpg',
          fileId: 'publisher-id',
          name: 'publisher.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.processarEditoraImage(1, mockFile);

      expect(result).toBe('https://example.com/publisher.jpg');
    });

    it('deve processar imagem de editora com URL de imagem antiga', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/publisher.jpg',
          fileId: 'publisher-id',
          name: 'publisher.jpg',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockHttpService.get.mockReturnValue(of({ data: [{ fileId: 'old-publisher-id' }] }));
      mockHttpService.delete.mockReturnValue(of({ status: 200 }));

      const result = await service.processarEditoraImage(1, mockFile, 'https://imagekit.io/old-publisher.jpg');

      expect(result).toBe('https://example.com/publisher.jpg');
      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockHttpService.delete).toHaveBeenCalled();
    });
  });

  describe('validarUrlImageKit', () => {
    it('deve retornar true para URL válida do ImageKit', () => {
      const result = service.isImageKitUrl('https://imagekit.io/test.jpg');
      expect(result).toBe(true);
    });

    it('deve retornar false para URL que não é do ImageKit', () => {
      const result = service.isImageKitUrl('https://example.com/test.jpg');
      expect(result).toBe(false);
    });

    it('deve retornar false para URL inválida', () => {
      const result = service.isImageKitUrl('');
      expect(result).toBe(false);
    });
  });

  describe('deletarImagemPorUrl', () => {
    it('deve deletar imagem com sucesso', async () => {
      mockHttpService.get.mockReturnValue(of({ data: [{ fileId: 'test-id' }] }));
      mockHttpService.delete.mockReturnValue(of({ status: 200 }));

      await service.deleteImageByUrl('https://imagekit.io/test-image.jpg');

      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockHttpService.delete).toHaveBeenCalled();
    });

    it('deve lidar com a URL vazia', async () => {
      await service.deleteImageByUrl('');

      expect(mockHttpService.get).not.toHaveBeenCalled();
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });

    it('deve lidar com a URL inválida', async () => {
      mockHttpService.get.mockReturnValue(of({ data: [] }));

      await service.deleteImageByUrl('invalid-url');

      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });

    it('deve lidar com a falha na exclusão', async () => {
      mockHttpService.get.mockReturnValue(of({ data: [{ fileId: 'test-id' }] }));
      mockHttpService.delete.mockReturnValue(throwError(() => new Error('Delete failed')));

      // Não deve lançar erro
      await expect(service.deleteImageByUrl('https://imagekit.io/test-image.jpg')).resolves.toBeUndefined();
    });
  });

  describe('Obter a Configuração', () => {
    it('deve retornar objeto de configuração', () => {
      const config = service.getConfig();

      expect(config).toEqual({
        urlEndpoint: 'https://upload.imagekit.io/api/v1/files/upload',
        urlDelete: 'https://api.imagekit.io/v1/files',
        uploadTimeout: 30000,
        deleteTimeout: 10000,
        compressionQuality: 0.8,
        validation: {
          maxFileSize: 5242880,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          minWidth: 100,
          maxWidth: 4000,
          minHeight: 100,
          maxHeight: 4000,
          minAspectRatio: 0.5,
          maxAspectRatio: 2.0,
        },
      });
    });
  });
}); 
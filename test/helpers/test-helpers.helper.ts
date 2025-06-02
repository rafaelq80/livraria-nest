import { ImageKitServiceMock, ImageKitUploadResponse } from "./types.helper";

export class TestHelpers {
    // Mock tipado do ImageKitService
    static createImageKitServiceMock(): ImageKitServiceMock {
        return {
            handleImage: jest.fn().mockResolvedValue("https://mocked-imagekit-url.jpg"),
            uploadImage: jest.fn().mockResolvedValue({
                url: "https://mocked-imagekit-url.jpg",
                fileId: "mocked-file-id-123",
                name: "mocked-image.jpg",
                size: 1024,
                filePath: "/uploads/mocked-image.jpg"
            } satisfies ImageKitUploadResponse),
            processImage: jest.fn().mockResolvedValue(Buffer.from("mocked-processed-image")),
            deleteImage: jest.fn().mockResolvedValue(true),
            updateImage: jest.fn().mockResolvedValue("https://mocked-updated-url.jpg"),
        };
    }

    // Mock tipado para cenários de erro
    static createImageKitServiceMockWithError(): ImageKitServiceMock {
        return {
            handleImage: jest.fn().mockRejectedValue(new Error("Erro simulado no upload")),
            uploadImage: jest.fn().mockRejectedValue(new Error("Erro simulado no upload")),
            processImage: jest.fn().mockRejectedValue(new Error("Erro simulado no processamento")),
            deleteImage: jest.fn().mockResolvedValue(false),
        };
    }

    // Mock para teste específico de upload bem-sucedido
    static createImageKitServiceMockWithSuccess(uploadUrl: string): ImageKitServiceMock {
        return {
            handleImage: jest.fn().mockResolvedValue(uploadUrl),
            uploadImage: jest.fn().mockResolvedValue({
                url: uploadUrl,
                fileId: `file-${Date.now()}`,
                name: "uploaded-image.jpg",
                size: 2048,
                filePath: `/uploads/uploaded-image.jpg`
            } satisfies ImageKitUploadResponse),
            processImage: jest.fn().mockResolvedValue(Buffer.from("processed-image-data")),
            deleteImage: jest.fn().mockResolvedValue(true),
        };
    }
}
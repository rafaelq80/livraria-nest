/**
 * Mocks de serviços para testes E2E
 * Centraliza todos os mocks necessários para evitar dependências externas
 */

import { ImageKitService } from "../../src/imagekit/services/imagekit.service";
import { SendmailService } from "../../src/sendmail/services/sendmail.service";

/**
 * Mock do ImageKitService para testes
 * Simula o comportamento do serviço sem fazer chamadas reais para a API
 */
export const mockImageKitService: Partial<ImageKitService> = {
  processarUsuarioImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
  processarEditoraImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
  processarProdutoImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
  processarAutorImage: jest.fn().mockResolvedValue('https://fake.image.url/test.jpg'),
};

/**
 * Mock do SendmailService para testes
 * Simula o comportamento do serviço de email sem enviar emails reais
 */
export const mockSendmailService: Partial<SendmailService> = {
  sendmailConfirmacaoLegacy: jest.fn().mockResolvedValue(undefined),
  sendmailRecuperarSenhaLegacy: jest.fn().mockResolvedValue(undefined),
  sendMail: jest.fn().mockResolvedValue(undefined),
  sendmailConfirmacao: jest.fn().mockResolvedValue(undefined),
  sendmailRecuperarSenha: jest.fn().mockResolvedValue(undefined),
};

/**
 * Mock dos Guards de autenticação para testes
 * Permite que todas as requisições passem sem autenticação real
 */
export const mockAuthGuards = {
  canActivate: jest.fn().mockReturnValue(true),
};

/**
 * Função utilitária para limpar todos os mocks
 * Útil para resetar o estado dos mocks entre testes
 */
export const clearAllMocks = (): void => {
  jest.clearAllMocks();
  
  // Limpa mocks específicos dos serviços
  if (mockImageKitService.processarUsuarioImage) {
    (mockImageKitService.processarUsuarioImage as jest.Mock).mockClear();
  }
  if (mockImageKitService.processarEditoraImage) {
    (mockImageKitService.processarEditoraImage as jest.Mock).mockClear();
  }
  if (mockImageKitService.processarProdutoImage) {
    (mockImageKitService.processarProdutoImage as jest.Mock).mockClear();
  }
  if (mockImageKitService.processarAutorImage) {
    (mockImageKitService.processarAutorImage as jest.Mock).mockClear();
  }
  
  if (mockSendmailService.sendmailConfirmacaoLegacy) {
    (mockSendmailService.sendmailConfirmacaoLegacy as jest.Mock).mockClear();
  }
  if (mockSendmailService.sendmailRecuperarSenhaLegacy) {
    (mockSendmailService.sendmailRecuperarSenhaLegacy as jest.Mock).mockClear();
  }
  if (mockSendmailService.sendMail) {
    (mockSendmailService.sendMail as jest.Mock).mockClear();
  }
  if (mockSendmailService.sendmailConfirmacao) {
    (mockSendmailService.sendmailConfirmacao as jest.Mock).mockClear();
  }
  if (mockSendmailService.sendmailRecuperarSenha) {
    (mockSendmailService.sendmailRecuperarSenha as jest.Mock).mockClear();
  }
  
  mockAuthGuards.canActivate.mockClear();
}; 
import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Editora } from '../src/editora/entities/editora.entity';
import { EntityMocks } from './helpers/entity-mocks.helper';
import { RepositoryMocks } from './helpers/repository-mocks.helper';
import { E2ETestSetup } from './helpers/test-setup.helper';

interface EditoraCreateDto {
  nome: string;
}

interface EditoraUpdateDto {
  id: number;
  nome: string;
}

describe('Editora E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let editoraRepositoryMock: ReturnType<typeof RepositoryMocks.createEditoraRepositoryMock>;

  beforeAll(async () => {
    testSetup = new E2ETestSetup();
    editoraRepositoryMock = RepositoryMocks.createEditoraRepositoryMock();

    await testSetup.setupTestModule({
      entities: [Editora],
      repositoryMocks: {
        Editora: editoraRepositoryMock
      }
    });
  });

  afterAll(async () => {
    await testSetup.closeApp();
  });

  afterEach(() => {
    E2ETestSetup.clearAllMocks();
  });

  describe('GET /editoras', () => {
    it('Deve retornar todas as Editoras', async () => {
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/editoras')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(1);
      expect(editoraRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('GET /editoras/:id', () => {
    it('Deve retornar uma Editora pelo ID', async () => {
      const editoraMock = EntityMocks.createEditoraMock();
      
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/editoras/1')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(editoraMock);
      expect(editoraRepositoryMock.findOne).toHaveBeenCalled();
    });
  });

  describe('GET /editoras/nome/:nome', () => {
    it('Deve retornar todas as Editoras pelo nome', async () => {
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/editoras/nome/Globo')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(1);
      expect(editoraRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('POST /editoras', () => {
    it('Deve criar uma Editora', async () => {
      const novaEditora: EditoraCreateDto = { nome: 'Nova Editora' };
      
      const response = await request(testSetup.getApp().getHttpServer())
        .post('/editoras')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send(novaEditora)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe(novaEditora.nome);
      expect(editoraRepositoryMock.save).toHaveBeenCalled();
    });

    it('Deve retornar BAD_REQUEST (400) se o nome for null', async () => {
      await request(testSetup.getApp().getHttpServer())
        .post('/editoras')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PUT /editoras', () => {
    it('Deve atualizar uma editora existente', async () => {
      const editoraAtualizada: EditoraUpdateDto = { id: 1, nome: 'Editora Atualizada' };
      const editoraMock = EntityMocks.createEditoraMock();
      
      editoraRepositoryMock.findOne.mockResolvedValueOnce(editoraMock);
      
      const response = await request(testSetup.getApp().getHttpServer())
        .put('/editoras')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send(editoraAtualizada)
        .expect(HttpStatus.OK);

      expect(response.body.nome).toBe(editoraAtualizada.nome);
      expect(editoraRepositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('DELETE /editoras/:id', () => {
    it('Deve deletar uma editora pelo ID', async () => {
      const editoraMock = EntityMocks.createEditoraMock();
      editoraRepositoryMock.findOne.mockResolvedValueOnce(editoraMock);
      
      await request(testSetup.getApp().getHttpServer())
        .delete('/editoras/1')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(editoraRepositoryMock.delete).toHaveBeenCalledWith(1);
    });
  });
});
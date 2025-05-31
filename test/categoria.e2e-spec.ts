import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Categoria } from '../src/categoria/entities/categoria.entity';
import { EntityMocks } from './helpers/entity-mocks.helper';
import { RepositoryMocks } from './helpers/repository-mocks.helper';
import { E2ETestSetup } from './helpers/test-setup.helper';

interface CategoriaCreateDto {
  tipo: string;
}

interface CategoriaUpdateDto {
  id: number;
  tipo: string;
}

describe('Categoria E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let categoriaRepositoryMock: ReturnType<typeof RepositoryMocks.createCategoriaRepositoryMock>;

  beforeAll(async () => {
    testSetup = new E2ETestSetup();
    categoriaRepositoryMock = RepositoryMocks.createCategoriaRepositoryMock();

    await testSetup.setupTestModule({
      entities: [Categoria],
      repositoryMocks: {
        Categoria: categoriaRepositoryMock
      }
    });
  });

  afterAll(async () => {
    await testSetup.closeApp();
  });

  afterEach(() => {
    E2ETestSetup.clearAllMocks();
  });

  describe('GET /categorias', () => {
    it('Deve retornar todas as Categorias', async () => {
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/categorias')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(1);
      expect(categoriaRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('GET /categorias/:id', () => {
    it('Deve retornar uma Categoria pelo ID', async () => {
      const categoriaMock = EntityMocks.createCategoriaMock();
      
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/categorias/1')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(categoriaMock);
      expect(categoriaRepositoryMock.findOne).toHaveBeenCalled();
    });
  });

  describe('GET /categorias/tipo/:tipo', () => {
    it('Deve retornar todas as Categorias pelo tipo', async () => {
      const response = await request(testSetup.getApp().getHttpServer())
        .get('/categorias/tipo/Brasileira')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(1);
      expect(categoriaRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('POST /categorias', () => {
    it('Deve criar uma Categoria', async () => {
      const novaCategoria: CategoriaCreateDto = { tipo: 'Nova Categoria' };
      
      const response = await request(testSetup.getApp().getHttpServer())
        .post('/categorias')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send(novaCategoria)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.tipo).toBe(novaCategoria.tipo);
      expect(categoriaRepositoryMock.save).toHaveBeenCalled();
    });

    it('Deve retornar BAD_REQUEST (400) se o tipo for null', async () => {
      await request(testSetup.getApp().getHttpServer())
        .post('/categorias')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PUT /categorias', () => {
    it('Deve atualizar uma categoria existente', async () => {
      const categoriaAtualizada: CategoriaUpdateDto = { id: 1, tipo: 'Categoria Atualizada' };
      const categoriaMock = EntityMocks.createCategoriaMock();
      
      categoriaRepositoryMock.findOne.mockResolvedValueOnce(categoriaMock);
      
      const response = await request(testSetup.getApp().getHttpServer())
        .put('/categorias')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .send(categoriaAtualizada)
        .expect(HttpStatus.OK);

      expect(response.body.tipo).toBe(categoriaAtualizada.tipo);
      expect(categoriaRepositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('DELETE /categorias/:id', () => {
    it('Deve deletar uma categoria pelo ID', async () => {
      const categoriaMock = EntityMocks.createCategoriaMock();
      categoriaRepositoryMock.findOne.mockResolvedValueOnce(categoriaMock);
      
      await request(testSetup.getApp().getHttpServer())
        .delete('/categorias/1')
        .set('Authorization', `Bearer ${testSetup.getToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(categoriaRepositoryMock.delete).toHaveBeenCalledWith(1);
    });
  });
});
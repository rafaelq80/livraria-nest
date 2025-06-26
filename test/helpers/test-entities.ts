/**
 * Configuração de entidades para testes E2E
 * Centraliza todas as entidades necessárias para o banco de dados de teste
 */

import { Autor } from "../../src/autor/entities/autor.entity";
import { Categoria } from "../../src/categoria/entities/categoria.entity";
import { Editora } from "../../src/editora/entities/editora.entity";
import { Produto } from "../../src/produto/entities/produto.entity";
import { Role } from "../../src/role/entities/role.entity";
import { Usuario } from "../../src/usuario/entities/usuario.entity";
import { EntitySchema } from "typeorm";

/**
 * Lista padrão de entidades para testes
 * Inclui todas as entidades principais do sistema
 */
export const defaultTestEntities = [
  Usuario,
  Produto,
  Categoria,
  Autor,
  Editora,
  Role,
];

/**
 * Tipo seguro para entidades do TypeORM
 */
export type EntityClassOrSchema = (new (...args: unknown[]) => unknown) | string | EntitySchema<unknown>;

/**
 * Configuração padrão do TypeORM para testes
 * Usa SQLite em memória para isolamento e velocidade
 */
export const getTestTypeOrmConfig = (extraEntities: EntityClassOrSchema[] = []) => ({
  type: "sqlite" as const,
  database: ":memory:",
  entities: [...defaultTestEntities, ...extraEntities],
  synchronize: true,
  dropSchema: true,
  logging: false, // Desabilita logs SQL para testes mais limpos
});

/**
 * Tipo para configuração customizada do TypeORM
 */
export interface TestTypeOrmConfigOptions {
  extraEntities?: EntityClassOrSchema[];
  logging?: boolean;
  dropSchema?: boolean;
  synchronize?: boolean;
}

/**
 * Função para criar configuração customizada do TypeORM
 */
export const createTestTypeOrmConfig = (options: TestTypeOrmConfigOptions = {}) => {
  const {
    extraEntities = [],
    logging = false,
    dropSchema = true,
    synchronize = true,
  } = options;

  return {
    type: "sqlite" as const,
    database: ":memory:",
    entities: [...defaultTestEntities, ...extraEntities],
    synchronize,
    dropSchema,
    logging,
  };
}; 
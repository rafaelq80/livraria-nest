import { Injectable } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { Usuario } from "../../usuario/entities/usuario.entity";
import { Produto } from "../../produto/entities/produto.entity";
import { Categoria } from "../../categoria/entities/categoria.entity";

@Injectable()
export class TestService implements TypeOrmOptionsFactory {

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
          type: "sqlite",
          database: ":memory:",
          entities: [Produto, Categoria, Usuario],
          synchronize: true,
          dropSchema: true
    };
  }
}
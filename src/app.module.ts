import { Module } from '@nestjs/common';
import { AutorModule } from './autor/autor.module';
import { ProdutoModule } from './produto/produto.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './produto/entities/produto.entity';
import { Autor } from './autor/entities/autor.entity';
import { Categoria } from './categoria/entities/categoria.entity';
import { Editora } from './editora/entities/editora.entity';
import { CategoriaModule } from './categoria/categoria.module';
import { EditoraModule } from './editora/editora.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'db_livraria',
      entities: [Produto, Autor, Categoria, Editora],
      synchronize: true,
      //logging: true,
    }),
    ProdutoModule,
    AutorModule,
    CategoriaModule,
    EditoraModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

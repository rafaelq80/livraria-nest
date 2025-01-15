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
import { UsuarioModule } from './usuario/usuario.module';
import { Usuario } from './usuario/entities/usuario.entity';
import { SecurityModule } from './security/security.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'db_livraria',
      entities: [Produto, Autor, Categoria, Editora, Usuario],
      synchronize: true,
      //logging: true,
    }),
    ProdutoModule,
    AutorModule,
    CategoriaModule,
    EditoraModule,
    UsuarioModule,
    SecurityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

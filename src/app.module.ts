import { Module } from '@nestjs/common';
import { AutorModule } from './autor/autor.module';
import { ProdutoModule } from './produto/produto.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './produto/entities/produto.entity';
import { Autor } from './autor/entities/autor.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'db_livraria',
      entities: [Produto, Autor],
      synchronize: true,
      //logging: true,
    }),
    ProdutoModule,
    AutorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './entities/produto.entity';
import { ProdutoController } from './controllers/produto.controller';
import { ProdutoService } from './services/produto.service';
import { AutorService } from '../autor/services/autor.service';
import { AutorModule } from '../autor/autor.module';

@Module({
    imports: [TypeOrmModule.forFeature([Produto]), AutorModule],
    controllers: [ProdutoController],
    providers: [ProdutoService, AutorService],
    exports: [TypeOrmModule]
})
export class ProdutoModule {};
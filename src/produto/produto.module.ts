import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaModule } from '../categoria/categoria.module';
import { EditoraModule } from '../editora/editora.module';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { ProdutoController } from './controllers/produto.controller';
import { Produto } from './entities/produto.entity';
import { ProdutoService } from './services/produto.service';
import { AutorModule } from '../autor/autor.module';

@Module({
    imports: [TypeOrmModule.forFeature([Produto]), AutorModule, CategoriaModule, EditoraModule, ImageKitModule],
    controllers: [ProdutoController],
    providers: [ProdutoService],
    exports: [TypeOrmModule]
})
export class ProdutoModule {};
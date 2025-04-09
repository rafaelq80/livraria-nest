import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './entities/produto.entity';
import { ProdutoController } from './controllers/produto.controller';
import { ProdutoService } from './services/produto.service';
import { AutorService } from '../autor/services/autor.service';
import { AutorModule } from '../autor/autor.module';
import { CategoriaModule } from '../categoria/categoria.module';
import { EditoraModule } from '../editora/editora.module';
import { CategoriaService } from '../categoria/services/categoria.service';
import { EditoraService } from '../editora/services/editora.service';
import { ImageKitModule } from '../imagekit/imagekit.module';

@Module({
    imports: [TypeOrmModule.forFeature([Produto]), AutorModule, CategoriaModule, EditoraModule, ImageKitModule],
    controllers: [ProdutoController],
    providers: [ProdutoService, AutorService, CategoriaService, EditoraService],
    exports: [TypeOrmModule]
})
export class ProdutoModule {};
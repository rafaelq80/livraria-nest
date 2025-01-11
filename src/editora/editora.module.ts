import { Module } from '@nestjs/common';
import { Editora } from './entities/editora.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditoraController } from './controllers/editora.controller';
import { EditoraService } from './services/editora.service';

@Module({
    imports: [TypeOrmModule.forFeature([Editora])],
    controllers: [EditoraController],
    providers: [EditoraService],
    exports: [TypeOrmModule]
})
export class EditoraModule {};
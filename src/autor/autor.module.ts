import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Autor } from './entities/autor.entity';
import { AutorController } from './controllers/autor.controller';
import { AutorService } from './services/autor.service';

@Module({
    imports: [TypeOrmModule.forFeature([Autor])],
    controllers: [AutorController],
    providers: [AutorService],
    exports: [TypeOrmModule]
})
export class AutorModule {};
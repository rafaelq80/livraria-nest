import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './controllers/role.controller';
import { Role } from './entities/role.entity';
import { RoleService } from './services/role.service';

@Module({
    imports: [TypeOrmModule.forFeature([Role])],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [TypeOrmModule, RoleService],
})
export class RoleModule {};
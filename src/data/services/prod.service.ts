import { Injectable } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";

@Injectable()
export class ProdService implements TypeOrmOptionsFactory {
    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            logging: false,
            dropSchema: false,
            synchronize: true,
            autoLoadEntities: true,
            ssl: {
                rejectUnauthorized: false,
            },
            extra: {
                decimalNumbers: true,
            },
        };
    }
}
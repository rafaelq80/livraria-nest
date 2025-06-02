import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, Length } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Produto } from '../../produto/entities/produto.entity';

@Entity({ name: 'tb_categorias' })
@Index('IDX_CATEGORIA_TIPO', ['tipo'], { unique: true })
export class Categoria {

  @ApiProperty({ description: 'ID da categoria' })
  @PrimaryGeneratedColumn() 
  id: number;

  @ApiProperty({ 
    description: 'Tipo/Nome da categoria', 
    example: 'Literatura Brasileira' 
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Tipo da categoria é obrigatório' })
  @Length(2, 100, { message: 'Tipo deve ter entre 2 e 100 caracteres' })
  @Column({ length: 100, nullable: false, unique: true })
  tipo: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização do registro' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ type: () => Produto, isArray: true, description: 'Produtos da categoria' })
  @OneToMany(() => Produto, (produto) => produto.categoria, { lazy: true })
  produtos: Produto[];
  
}
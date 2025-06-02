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

@Entity({ name: 'tb_editoras' })
@Index('IDX_EDITORA_NOME', ['nome'], { unique: true })
export class Editora {

  @ApiProperty({ description: 'ID da editora' })
  @PrimaryGeneratedColumn() 
  id: number;

  @ApiProperty({ description: 'Nome da editora', example: 'Companhia das Letras' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Nome da editora é obrigatório' })
  @Length(2, 255, { message: 'Nome deve ter entre 2 e 255 caracteres' })
  @Column({ length: 255, nullable: false, unique: true })
  nome: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização do registro' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ type: () => Produto, isArray: true, description: 'Produtos da editora' })
  @OneToMany(() => Produto, (produto) => produto.editora, { lazy: true })
  produtos: Produto[];
  
}
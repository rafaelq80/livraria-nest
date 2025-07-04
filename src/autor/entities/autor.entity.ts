import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Produto } from '../../produto/entities/produto.entity';

@Entity('tb_autores')
@Index('IDX_AUTOR_NOME', ['nome'])
export class Autor {
  
  @ApiProperty({ description: 'ID do autor' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Nome completo do autor', 
    example: 'Machado de Assis' 
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Nome do autor é obrigatório' })
  @Length(2, 255, { message: 'Nome deve ter entre 2 e 255 caracteres' })
  @Column({ length: 255, nullable: false })
  nome: string;

  @ApiProperty({ 
    description: 'Nacionalidade do autor', 
    example: 'Brasileira',
    required: false
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsOptional()
  @IsString({ message: 'Nacionalidade deve ser uma string' })
  @Column({ length: 100, nullable: true })
  nacionalidade?: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização do registro' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ type: () => Produto, isArray: true, description: 'Produtos do autor' })
  @ManyToMany(() => Produto, (produto) => produto.autores, { lazy: true })
  produtos: Produto[];
}

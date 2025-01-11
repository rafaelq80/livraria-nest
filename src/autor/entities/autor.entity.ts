import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { Produto } from '../../produto/entities/produto.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('tb_autores')
export class Autor {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  nome: string;

  @Column({ length: 255 })
  nacionalidade: string;

  @ManyToMany(() => Produto, (produto) => produto.autores)
  produtos: Produto[];
  
}

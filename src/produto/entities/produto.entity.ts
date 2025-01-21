import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Autor } from '../../autor/entities/autor.entity';
import { IsISBN } from '../../util/validators/isisbn.validator';
import { Categoria } from '../../categoria/entities/categoria.entity';
import { Editora } from '../../editora/entities/editora.entity';
import { NumericTransformer } from '../../util/numerictransformer';

@Entity('tb_produtos')
export class Produto {
  @PrimaryGeneratedColumn()
  id: number;

  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  titulo: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new NumericTransformer() })
  preco: number;

  @Column({ length: 5000 })
  foto: string;

  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn10: string;

  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn13: string;

  @ManyToMany(() => Autor, (autor) => autor.produtos)
  @JoinTable({
    name: 'tb_produtos_autores',
    joinColumn: { name: 'produto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'autor_id', referencedColumnName: 'id' },
  })
  autores: Autor[];

  @ManyToOne(() => Categoria, (categoria) => categoria.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' }) 
  categoria: Categoria;

  @ManyToOne(() => Editora, (editora) => editora.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'editora_id' }) 
  editora: Editora;
}

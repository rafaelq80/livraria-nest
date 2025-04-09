import { ApiProperty } from '@nestjs/swagger';
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
import { Categoria } from '../../categoria/entities/categoria.entity';
import { Editora } from '../../editora/entities/editora.entity';
import { IsISBN } from '../../util/validators/isisbn.validator';

@Entity('tb_produtos')
export class Produto {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  titulo: string;

  @ApiProperty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Column({ type: 'decimal', precision: 10, scale: 2})
  preco: number;

  @ApiProperty()
	@Column({ type: "varchar", length: 5000, nullable: true })
	foto?: string

  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn10: string;

  @ApiProperty()
  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn13: string;

  @ApiProperty({ type: () => Autor })
  @ManyToMany(() => Autor, (autor) => autor.produtos)
  @JoinTable({
    name: 'tb_produtos_autores',
    joinColumn: { name: 'produto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'autor_id', referencedColumnName: 'id' },
  })
  autores: Autor[];

  @ApiProperty({ type: () => Categoria })
  @ManyToOne(() => Categoria, (categoria) => categoria.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' }) 
  categoria: Categoria;

  @ApiProperty({ type: () => Editora })
  @ManyToOne(() => Editora, (editora) => editora.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'editora_id' }) 
  editora: Editora;
}

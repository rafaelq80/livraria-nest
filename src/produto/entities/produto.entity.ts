import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
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

  @ApiProperty({ description: 'ID do livro' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Título do livro' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  titulo: string;

  @ApiProperty({ description: 'Descrição detalhada do livro' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsString()
  @IsOptional()
  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @ApiProperty({ description: 'Preço do livro' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Column({ type: 'decimal', precision: 10, scale: 2})
  preco: number;

  @ApiProperty({
    example: 0,
    description: 'Percentual de desconto (de 0 a 100) do livro',
    default: 0,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  desconto: number = 0;

  @ApiProperty({ description: 'Foto da capa do livro' })
  @Column({ type: "varchar", length: 5000, nullable: true })
  foto?: string

  @ApiProperty({ description: 'Número total de páginas do livro' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Column({ type: 'int', nullable: true })
  paginas?: number;

  @ApiProperty({ description: 'Idioma do livro', example: 'Português' })
  @IsString()
  @IsOptional()
  @Column({ length: 50, nullable: true })
  idioma?: string;

  @ApiProperty({ description: 'ISBN-10 do livro', example: '0-306-40615-2' })
  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn10: string;

  @ApiProperty({ description: 'ISBN-13 do livro', example: '978-3-16-148410-0' })
  @IsISBN({ message: 'ISBN-13 inválido.' })
  @Column({ length: 255, nullable: false })
  isbn13: string;

  @ApiProperty({ type: () => Autor, description: 'Lista de Autores do livro' })
  @ManyToMany(() => Autor, (autor) => autor.produtos)
  @JoinTable({
    name: 'tb_produtos_autores',
    joinColumn: { name: 'produto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'autor_id', referencedColumnName: 'id' },
  })
  autores: Autor[];

  @ApiProperty({ type: () => Categoria, description: 'Categoria do livro', example: 'Literatura Brasileira' })
  @ManyToOne(() => Categoria, (categoria) => categoria.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' }) 
  categoria: Categoria;

  @ApiProperty({ type: () => Editora, description: 'Editora do livro' })
  @ManyToOne(() => Editora, (editora) => editora.produto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'editora_id' }) 
  editora: Editora;
}
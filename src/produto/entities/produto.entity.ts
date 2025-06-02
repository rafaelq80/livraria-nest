import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Autor } from '../../autor/entities/autor.entity';
import { Categoria } from '../../categoria/entities/categoria.entity';
import { Editora } from '../../editora/entities/editora.entity';
import { IsISBN } from '../../util/validators/isisbn.validator';

@Entity('tb_produtos')
@Index('IDX_PRODUTO_TITULO', ['titulo']) // Índice para buscas por título
@Index('IDX_PRODUTO_ISBN10', ['isbn10'], { unique: true, where: 'isbn10 IS NOT NULL' })
@Index('IDX_PRODUTO_ISBN13', ['isbn13'], { unique: true, where: 'isbn13 IS NOT NULL' })
export class Produto {

  @ApiProperty({ description: 'ID do livro' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Título do livro' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @Length(1, 255, { message: 'Título deve ter entre 1 e 255 caracteres' })
  @Column({ length: 255, nullable: false })
  titulo: string;

  @ApiProperty({ description: 'Descrição detalhada do livro' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsString()
  @IsOptional()
  @Length(0, 2000, { message: 'Descrição deve ter no máximo 2000 caracteres' })
  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @ApiProperty({ description: 'Preço do livro', example: 29.99 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço deve ter no máximo 2 casas decimais' })
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  @Max(9999999.99, { message: 'Preço muito alto' })
  @IsNotEmpty({ message: 'Preço é obrigatório' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @ApiProperty({
    example: 0,
    description: 'Percentual de desconto (de 0 a 100) do livro',
    default: 0,
  })
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Desconto deve ter no máximo 2 casas decimais' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  @Max(100, { message: 'Desconto não pode ser maior que 100%' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  desconto: number = 0;

  @ApiProperty({ 
    description: 'URL da foto da capa do livro',
    example: 'https://example.com/capa.jpg'
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL da foto inválida' })
  @Length(0, 500, { message: 'URL da foto muito longa' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  foto?: string;

  @ApiProperty({ description: 'Número total de páginas do livro' })
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsOptional()
  @IsNumber({}, { message: 'Páginas deve ser um número' })
  @Min(1, { message: 'Número de páginas deve ser maior que zero' })
  @Max(50000, { message: 'Número de páginas muito alto' })
  @Column({ type: 'int', nullable: true })
  paginas?: number;

  @ApiProperty({ 
    description: 'Idioma do livro', 
    example: 'Português',
    enum: ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Outros']
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Idioma deve ter entre 2 e 50 caracteres' })
  @Column({ length: 50, nullable: true, default: 'Português' })
  idioma?: string;

  @ApiProperty({ 
    description: 'ISBN-10 do livro', 
    example: '0-306-40615-2',
    required: false
  })
  @IsOptional()
  @IsISBN({ message: 'ISBN-10 inválido.' })
  @Column({ length: 17, nullable: true, unique: true })
  isbn10?: string;

  @ApiProperty({ 
    description: 'ISBN-13 do livro', 
    example: '978-3-16-148410-0',
    required: false
  })
  @IsOptional()
  @IsISBN({ message: 'ISBN-13 inválido.' })
  @Column({ length: 20, nullable: true, unique: true })
  isbn13?: string;

  // Campos de auditoria
  @ApiProperty({ description: 'Data de criação do registro' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização do registro' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamentos
  @ApiProperty({ type: () => Autor, isArray: true, description: 'Lista de Autores do livro' })
  @ManyToMany(() => Autor, (autor) => autor.produtos)
  @JoinTable({
    name: 'tb_produtos_autores',
    joinColumn: { name: 'produto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'autor_id', referencedColumnName: 'id' },
  })
  autores: Autor[];

  @ApiProperty({ 
    type: () => Categoria, 
    description: 'Categoria do livro', 
    example: 'Literatura Brasileira' 
  })
  @ManyToOne(() => Categoria, (categoria) => categoria.produtos, {
    onDelete: 'RESTRICT', // Não permite deletar categoria se tiver produtos
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @ApiProperty({ type: () => Editora, description: 'Editora do livro' })
  @ManyToOne(() => Editora, (editora) => editora.produtos, {
    onDelete: 'RESTRICT', // Não permite deletar editora se tiver produtos
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'editora_id' })
  editora: Editora;

  // Propriedades calculadas
  @ApiProperty({ description: 'Preço com desconto aplicado' })
  get precoComDesconto(): number {
    return this.preco * (1 - this.desconto / 100);
  }

  @ApiProperty({ description: 'Indica se o produto tem desconto' })
  get temDesconto(): boolean {
    return this.desconto > 0;
  }

}
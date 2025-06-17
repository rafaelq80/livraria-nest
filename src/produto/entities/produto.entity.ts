import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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

  @ApiProperty({ 
    description: 'Título do livro',
    example: 'Dom Casmurro'
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @Length(2, 255, { message: 'Título deve ter entre 2 e 255 caracteres' })
  @Column({ length: 255, nullable: false })
  titulo: string;

  @ApiProperty({ 
    description: 'Sinopse do livro',
    example: 'Dom Casmurro é um romance escrito por Machado de Assis...'
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Sinopse é obrigatória' })
  @Length(10, 5000, { message: 'Sinopse deve ter entre 10 e 5000 caracteres' })
  @Column({ type: 'text', nullable: false })
  sinopse: string;

  @ApiProperty({ 
    description: 'Preço do livro',
    example: 49.90,
    minimum: 0
  })
  @IsNotEmpty({ message: 'Preço é obrigatório' })
  @Min(0, { message: 'Preço não pode ser negativo' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  preco: number;

  @ApiProperty({ 
    description: 'Foto do livro',
    example: 'https://example.com/foto.jpg',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Foto deve ser uma string' })
  @Length(5, 5000, { message: 'Foto deve ter entre 5 e 5000 caracteres' })
  @Column({ length: 5000, nullable: true })
  foto?: string;

  @ApiProperty({ 
    description: 'Número de páginas',
    example: 256,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Número de páginas é obrigatório' })
  @Min(1, { message: 'Número de páginas deve ser maior que zero' })
  @Column({ type: 'int', nullable: false })
  paginas: number;

  @ApiProperty({ 
    description: 'Ano de publicação',
    example: 2023,
    minimum: 1800
  })
  @IsNotEmpty({ message: 'Ano de publicação é obrigatório' })
  @Min(1800, { message: 'Ano de publicação deve ser maior que 1800' })
  @Max(new Date().getFullYear(), { message: 'Ano de publicação não pode ser maior que o ano atual' })
  @Column({ type: 'int', nullable: false })
  anoPublicacao: number;

  @ApiProperty({ 
    description: 'Idioma do livro',
    example: 'Português',
    enum: ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Outros']
  })
  @IsOptional()
  @IsString({ message: 'Idioma deve ser uma string' })
  @Length(2, 50, { message: 'Idioma deve ter entre 2 e 50 caracteres' })
  @IsIn(['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Outros'], 
    { message: 'Idioma deve ser um dos valores permitidos' })
  @Column({ length: 50, nullable: true, default: 'Português' })
  idioma?: string;

  @ApiProperty({ 
    description: 'ISBN-10 do livro',
    example: '0-306-40615-2',
    required: false
  })
  @IsOptional()
  @IsISBN('10', { message: 'ISBN-10 inválido' })
  @Column({ length: 17, nullable: true, unique: true })
  isbn10?: string;

  @ApiProperty({ 
    description: 'ISBN-13 do livro',
    example: '978-3-16-148410-0',
    required: false
  })
  @IsOptional()
  @IsISBN('13', { message: 'ISBN-13 inválido' })
  @Column({ length: 20, nullable: true, unique: true })
  isbn13?: string;

  @ApiProperty({ 
    description: 'Desconto do livro',
    example: 10,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Desconto deve ser um número' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  @Max(100, { message: 'Desconto não pode ser maior que 100' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  desconto: number;

  @ApiProperty({ 
    description: 'Edição do Livro',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Número da Edição do livro é obrigatório' })
  @Min(1, { message: 'Número da Edição do livro deve ser maior que zero' })
  @Column({ type: 'int', nullable: false, default: 1 })
  edicao?: number;
  
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
    return this.preco * (1 - (this.desconto || 0) / 100);
  }

  @ApiProperty({ description: 'Indica se o produto tem desconto' })
  get temDesconto(): boolean {
    return this.desconto > 0;
  }

}
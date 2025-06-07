import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { ApiProperty } from "@nestjs/swagger"
import { Transform, TransformFnParams } from "class-transformer"
import { IsNotEmpty, Length, IsString } from "class-validator"

@Entity("tb_roles")
export class Role {
	@ApiProperty({ description: 'ID da role' })
	@PrimaryGeneratedColumn()
	id: number

	@ApiProperty({ 
		description: 'Nome da role',
		example: 'admin'
	})
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsNotEmpty({ message: 'Nome da role é obrigatório' })
	@IsString({ message: 'Nome deve ser uma string' })
	@Length(2, 50, { message: 'Nome deve ter entre 2 e 50 caracteres' })
	@Column({ length: 255, nullable: false, unique: true })
	nome: string

	@ApiProperty({ 
		description: 'Descrição da role',
		example: 'Administrador do sistema'
	})
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsNotEmpty({ message: 'Descrição da role é obrigatória' })
	@IsString({ message: 'Descrição deve ser uma string' })
	@Length(5, 255, { message: 'Descrição deve ter entre 5 e 255 caracteres' })
	@Column({ length: 255, nullable: false })
	descricao: string

	@ApiProperty({ type: () => Usuario, isArray: true, description: 'Usuários com esta role' })
	@ManyToMany(() => Usuario, (usuario) => usuario.roles)
	usuarios: Usuario[]

	// Campos de auditoria
	@ApiProperty({ description: "Data de criação do registro" })
	@CreateDateColumn({ name: "created_at" })
	createdAt: Date

	@ApiProperty({ description: "Data de última atualização do registro" })
	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date
}

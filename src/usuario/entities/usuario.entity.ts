import { Transform, TransformFnParams } from "class-transformer"
import { IsEmail, IsNotEmpty, MinLength } from "class-validator"
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm"
import { Role } from "../../role/entities/role.entity"
import { ApiProperty } from "@nestjs/swagger"

@Entity({ name: "tb_usuarios" })
export class Usuario {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number

	@Column({ nullable: true })
	googleId?: string

	@ApiProperty()
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsNotEmpty()
	@Column({ length: 255, nullable: false })
	nome: string

	@ApiProperty()
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsEmail()
	@IsNotEmpty()
	@Column({ length: 255, nullable: false })
	usuario: string

	@ApiProperty()
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@MinLength(8)
	@IsNotEmpty()
	@Column({ type: "varchar", length: 255, nullable: false })
	senha: string

	@ApiProperty()
	@Column({ type: "varchar", length: 5000, nullable: true })
	foto?: string

	@ApiProperty()
	@ManyToMany(() => Role, (role) => role.usuarios, { eager: false, cascade: true })
	@JoinTable({
		name: "tb_usuarios_roles",
		joinColumn: { name: "usuario_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
	})
	roles: Role[]

	// Campos de auditoria
	@ApiProperty({ description: "Data de criação do registro" })
	@CreateDateColumn({ name: "created_at" })
	createdAt: Date

	@ApiProperty({ description: "Data de última atualização do registro" })
	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date
}

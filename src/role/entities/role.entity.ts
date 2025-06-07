import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { ApiProperty } from "@nestjs/swagger"

@Entity("tb_roles")
export class Role {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number

	@ApiProperty()
	@Column({ length: 255, nullable: false, unique: true })
	nome: string

	@ApiProperty()
	@Column({ length: 255, nullable: false })
	descricao: string

	@ApiProperty()
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

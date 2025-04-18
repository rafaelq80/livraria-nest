import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm"
import { Usuario } from "../../usuario/entities/usuario.entity"
import { ApiProperty } from "@nestjs/swagger"

@Entity('tb_roles')
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
}

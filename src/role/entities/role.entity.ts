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
	@ManyToMany(() => Usuario, (usuarios) => usuarios.roles)
	usuarios: Usuario[]
}

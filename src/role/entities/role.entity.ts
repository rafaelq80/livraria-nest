import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm"
import { Usuario } from "../../usuario/entities/usuario.entity"

@Entity('tb_roles')
export class Role {
	@PrimaryGeneratedColumn() 
	id: number

	@Column({ length: 255, nullable: false, unique: true })
	nome: string

	@ManyToMany(() => Usuario, (usuarios) => usuarios.roles)
	usuarios: Usuario[]
}

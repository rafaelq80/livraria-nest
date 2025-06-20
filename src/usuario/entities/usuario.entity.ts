import { Exclude, Transform, TransformFnParams } from "class-transformer"
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, Length, Matches } from "class-validator"
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
	
	@ApiProperty({ description: 'ID do usuário' })
	@PrimaryGeneratedColumn()
	id: number

	@ApiProperty({ 
		description: 'ID do Google (para login com Google)',
		required: false
	})
	@Exclude()
	@IsOptional()
	@IsString({ message: 'Google ID deve ser uma string' })
	@Column({ nullable: true })
	googleId?: string

	@ApiProperty({ 
		description: 'Nome completo do usuário',
		example: 'João da Silva'
	})
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsNotEmpty({ message: 'Nome é obrigatório' })
	@IsString({ message: 'Nome deve ser uma string' })
	@Length(2, 255, { message: 'Nome deve ter entre 2 e 255 caracteres' })
	@Column({ length: 255, nullable: false })
	nome: string

	@ApiProperty({ 
		description: 'Email do usuário',
		example: 'joao@email.com'
	})
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsEmail({}, { message: 'Email inválido' })
	@IsNotEmpty({ message: 'Email é obrigatório' })
	@Column({ length: 255, nullable: false, unique: true })
	usuario: string

	@ApiProperty({ 
		description: 'Senha do usuário',
		example: 'Senha@123'
	})
	@Exclude()
	@Transform(({ value }: TransformFnParams) => value?.trim())
	@IsNotEmpty({ message: 'Senha é obrigatória' })
	@MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{ message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial' }
	)
	@Column({ type: "varchar", length: 255, nullable: false })
	senha: string

	@ApiProperty({ 
		description: 'URL da foto do usuário',
		example: 'https://example.com/foto.jpg',
		required: false
	})
	@IsOptional()
	@IsString({ message: 'URL da foto deve ser uma string' })
	@Length(5, 5000, { message: 'URL da foto deve ter entre 5 e 5000 caracteres' })
	@Column({ type: "varchar", length: 5000, nullable: true })
	foto?: string

	@ApiProperty({ type: () => Role, isArray: true, description: 'Roles do usuário' })
	@ManyToMany(() => Role, (role) => role.usuarios)
	@JoinTable({
		name: "tb_usuarios_roles",
		joinColumn: { name: "usuario_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
	})
	roles: Role[]

	@ApiProperty({ description: 'Data de criação do registro' })
	@CreateDateColumn({ name: "created_at" })
	createdAt: Date

	@ApiProperty({ description: 'Data de última atualização do registro' })
	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date
}

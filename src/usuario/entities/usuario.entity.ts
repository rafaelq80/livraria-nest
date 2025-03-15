
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  MinLength
} from 'class-validator';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tb_usuarios' })
export class Usuario {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  nome: string;

  @ApiProperty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsEmail()
  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  usuario: string;

  @ApiProperty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @MinLength(8)
  @IsNotEmpty()
  @Column({ type: 'varchar', length: 255, nullable: false })
  senha: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 5000, nullable: true })
  foto?: string;

  @ApiProperty()
  @ManyToMany(() => Role, (roles) => roles.usuarios)
    @JoinTable({
      name: 'tb_usuarios_roles',
      joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];

}

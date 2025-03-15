import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Produto } from "../../produto/entities/produto.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: "tb_editoras"})
export class Editora {

    @ApiProperty()
    @PrimaryGeneratedColumn() 
    id: number

    @ApiProperty()
    @IsNotEmpty()
    @Column({length: 255, nullable: false})
    nome: string

    @ApiProperty()
    @OneToMany(() => Produto, (produto) => produto.editora)
    produto: Produto[]
    
}
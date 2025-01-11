import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Produto } from "../../produto/entities/produto.entity";

@Entity({name: "tb_editoras"})
export class Editora {

    @PrimaryGeneratedColumn() 
    id: number

    @IsNotEmpty()
    @Column({length: 255, nullable: false})
    nome: string

    @OneToMany(() => Produto, (produto) => produto.editora)
    produto: Produto[]
    
}
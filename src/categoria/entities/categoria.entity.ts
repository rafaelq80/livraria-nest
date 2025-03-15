import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Produto } from "../../produto/entities/produto.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: "tb_categorias"})
export class Categoria {

    @ApiProperty()
    @PrimaryGeneratedColumn() 
    id: number

    @ApiProperty()
    @IsNotEmpty()
    @Column({length: 100, nullable: false})
    tipo: string

    @ApiProperty()
    @OneToMany(() => Produto, (produto) => produto.categoria)
    produto: Produto[]
    
}
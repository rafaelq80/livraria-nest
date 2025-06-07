// usuarioautenticado.interface.ts
import { Role } from "../../role/entities/role.entity";

export type FlexibleRole = Role | { nome: string };

export interface UsuarioAutenticado {
    id: number;
    nome: string;
    usuario: string;
    foto?: string;
    roles?: FlexibleRole[];
    token: string;
}
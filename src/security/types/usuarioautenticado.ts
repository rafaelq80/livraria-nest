import { Role } from "../../role/entities/role.entity";

export interface UsuarioAutenticado {
    id: number;
    nome: string;
    usuario: string;
    foto?: string;
    roles?: Role[];
    token: string;
  }
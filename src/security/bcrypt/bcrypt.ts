import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from 'bcrypt';

@Injectable()
export class Bcrypt{
	constructor(private readonly configService: ConfigService) {}

    async criptografarSenha(senha: string): Promise<string> {
        const saltRounds = this.configService.get<number>('auth.bcryptSaltRounds') || 10;
        return await bcrypt.hash(senha, saltRounds)
    }

    async compararSenhas(senhaDigitada: string, senhaBanco: string): Promise<boolean> {
        return await bcrypt.compare(senhaDigitada, senhaBanco);
    }
}
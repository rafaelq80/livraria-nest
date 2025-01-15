import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { UsuarioLogin } from '../entities/usuariologin.entity';
import { LocalAuthGuard } from '../guard/local-auth.guard';
import { SecurityService } from '../services/security.service';

@Controller("/usuarios")
export class SecurityController {
    constructor(private securityService: SecurityService) { }

    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('/logar')
    async login(@Body() user: UsuarioLogin): Promise<any> {
        return this.securityService.login(user);
    }

}
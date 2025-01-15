import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from '../guard/local-auth.guard';
import { SecurityService } from '../services/security.service';
import { UsuarioLogin } from '../types/usuariologin';

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
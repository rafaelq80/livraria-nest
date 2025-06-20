import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from './security/decorators/public.decorator';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @ApiExcludeEndpoint()
  @Get()
  async redirect(@Res() resposta: Response) {
    return resposta.redirect('/swagger');
  }
}

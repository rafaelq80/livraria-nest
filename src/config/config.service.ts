import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get mail() {
    return {
      emailUser: this.configService.get<string>('EMAIL_USER'),
      emailPassword: this.configService.get<string>('EMAIL_PASSWORD'),
    };
  }
} 
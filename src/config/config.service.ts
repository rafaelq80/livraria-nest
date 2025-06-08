import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('port');
  }

  get database() {
    return {
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  get imagekit() {
    return {
      publicKey: this.configService.get<string>('imagekit.publicKey'),
      privateKey: this.configService.get<string>('imagekit.privateKey'),
      urlEndpoint: this.configService.get<string>('imagekit.urlEndpoint'),
    };
  }

  get mail() {
    return {
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      user: this.configService.get<string>('mail.user'),
      pass: this.configService.get<string>('mail.pass'),
    };
  }

  get cors() {
    return {
      origin: this.configService.get<string>('cors.origin'),
    };
  }

  get google() {
    return {
      clientId: this.configService.get<string>('google.clientId'),
      clientSecret: this.configService.get<string>('google.clientSecret'),
      callbackURL: this.configService.get<string>('google.callbackURL'),
      scope: this.configService.get<string[]>('google.scope'),
    };
  }
} 
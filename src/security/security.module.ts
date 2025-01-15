import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsuarioModule } from '../usuario/usuario.module';
import { Bcrypt } from './bcrypt/bcrypt';
import { SecurityController } from './controllers/security.controller';
import { SecurityService } from './services/security.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';

@Module({
  imports: [
    UsuarioModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [Bcrypt, SecurityService, LocalStrategy, JwtStrategy],
  controllers: [SecurityController],
  exports: [Bcrypt, JwtModule],
})
export class SecurityModule { }
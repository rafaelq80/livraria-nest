import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendmailService } from './service/sendmail.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [SendmailService],
  exports: [SendmailService],
})
export class SendmailModule {}
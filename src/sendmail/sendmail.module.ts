import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendmailService } from './services/sendmail.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [SendmailService],
  exports: [SendmailService],
})
export class SendmailModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ImageKitService } from './services/imagekit.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule
  ],
  providers: [ImageKitService],
  exports: [ImageKitService],
})
export class ImageKitModule {}
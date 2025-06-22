import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ImageKitService } from './services/imagekit.service';
import { ImageValidationService } from './services/image-validation.service';
import { ImageCacheService } from './services/image-cache.service';
import { ImageKitInterceptor } from './interceptors/imagekit.interceptor';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  providers: [
    ImageKitService,
    ImageValidationService,
    ImageCacheService,
    ImageKitInterceptor,
  ],
  exports: [
    ImageKitService,
    ImageValidationService,
    ImageCacheService,
    ImageKitInterceptor,
  ],
})
export class ImageKitModule {}
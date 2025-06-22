import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheEntry {
  value: unknown;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  defaultTtl: number; // em milissegundos
  maxSize: number;
  cleanupInterval: number; // em milissegundos
}

@Injectable()
export class ImageCacheService {
  private readonly logger = new Logger(ImageCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      defaultTtl: this.configService.get<number>('imagekit.cacheTtl') || 5 * 60 * 1000, // 5 minutos
      maxSize: this.configService.get<number>('imagekit.cacheMaxSize') || 1000,
      cleanupInterval: this.configService.get<number>('imagekit.cacheCleanupInterval') || 60 * 1000, // 1 minuto
    };

    this.startCleanupTimer();
  }

  /**
   * Armazena um valor no cache
   */
  set(key: string, value: unknown, ttl?: number): void {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
    };

    // Verifica se o cache está cheio
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.logger.debug(`Cache set: ${key}`);
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verifica se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache delete: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpa o cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Remove o item mais antigo do cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Remove itens expirados do cache
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Inicia o timer de limpeza
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Calcula a taxa de acerto do cache (simplificado)
   */
  private calculateHitRate(): number {
    // Implementação simplificada - em produção seria necessário rastrear hits/misses
    return this.cache.size > 0 ? 0.8 : 0; // Placeholder
  }

  /**
   * Para o timer de limpeza
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
} 
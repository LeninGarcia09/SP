import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  async health() {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Cache check
    try {
      await this.cache.set('health-check', 'ok', 5_000);
      const val = await this.cache.get('health-check');
      checks.cache = val === 'ok' ? 'ok' : 'error';
    } catch {
      checks.cache = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

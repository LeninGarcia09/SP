import { Controller, Get, Inject, Req } from '@nestjs/common';
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

  /** Temporary debug endpoint — decodes JWT without verification to inspect claims */
  @Get('debug-token')
  @ApiOperation({ summary: 'Debug: decode JWT claims (no verification)' })
  debugToken(@Req() req: { headers: { authorization?: string } }) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return { error: 'No Bearer token found' };
    }
    const token = auth.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT format' };
    }
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return {
        header,
        claims: {
          aud: payload.aud,
          iss: payload.iss,
          tid: payload.tid,
          sub: payload.sub,
          oid: payload.oid,
          preferred_username: payload.preferred_username,
          name: payload.name,
          scp: payload.scp,
          exp: payload.exp,
          iat: payload.iat,
          ver: payload.ver,
        },
        expectedAudience: `api://${process.env.AZURE_AD_CLIENT_ID}`,
      };
    } catch {
      return { error: 'Failed to decode token' };
    }
  }
}

import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { KeysService } from '../keys/keys.service';

@Injectable()
export class ApiKeyGuard {
  constructor(private keysService: KeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('No API key provided');
    }
    if (apiKey.revoked) throw new ForbiddenException('API key revoked');
    if (apiKey.expiresAt < new Date()) throw new ForbiddenException('API key expired');

    const result = await this.keysService.validateApiKey(apiKey);

    if (!result) {
      throw new UnauthorizedException('Invalid, expired or revoked API key');
    }

    req.user = result.apiKey.user;
    req.apiKey = result.apiKey;
    req.permissions = result.permissions;
    req.authType = 'api-key';
    return true;
  }
}
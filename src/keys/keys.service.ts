import { Injectable, BadRequestException, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from 'src/entities/api-key.entity';
import { User } from 'src/entities/user.entity';
import { CreateKeyDto } from './dto/create-key.dto';
import { RolloverKeyDto } from './dto/rollover-key.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class KeysService {
    constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
  ) {}

 private calculateExpiry(expiry: string): Date {
    const now = new Date();
    switch (expiry) {
      case '1H':
        now.setHours(now.getHours() + 1);
        break;
      case '1D':
        now.setDate(now.getDate() + 1);
        break;
      case '1M':
        now.setMonth(now.getMonth() + 1);
        break;
      case '1Y':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException('Invalid expiry');
    }
    return now;
  }

  private generateKey(): string {
    return 'sk_' + crypto.randomBytes(32).toString('hex');
  }

   async createApiKey(userId: string, dto: CreateKeyDto): Promise<ApiKey> {
    const activeKeys = await this.apiKeyRepo.count({
      where: { userId, revoked: false }
    });

    if (activeKeys >= 5) {
      throw new ForbiddenException('Maximum 5 active API keys allowed');
    }

    const validPermissions = ['deposit', 'transfer', 'read'];
    const invalidPerms = dto.permissions.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }

    const rawKey = this.generateKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);

    const apiKey = this.apiKeyRepo.create({
      key: hashedKey,
      name: dto.name,
      permissions: dto.permissions,
      expiresAt: this.calculateExpiry(dto.expiry),
      userId,
    });

    await this.apiKeyRepo.save(apiKey);

    return {
        ...apiKey,
        id: apiKey.id,
        key: rawKey,
        name: apiKey.name,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      
    };
  }

  async rolloverApiKey(userId: string, dto: RolloverKeyDto) {
    // Find the expired key
    const oldKey = await this.apiKeyRepo.findOne({
      where: { id: dto.expiredKeyId, userId },
    });

    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    if (new Date() <= oldKey.expiresAt) {
      throw new BadRequestException('Key must be expired to rollover');
    }

    const activeKeys = await this.apiKeyRepo.count({
      where: { userId, revoked: false },
    });

    if (activeKeys >= 5) {
      throw new ConflictException('Maximum 5 active API keys allowed. Revoke one first.');
    }

    const rawKey = this.generateKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiry(dto.expiry);

    const newApiKey = this.apiKeyRepo.create({
      key: hashedKey,
      name: oldKey.name + ' (rolled over)',
      permissions: oldKey.permissions, 
      expiresAt: this.calculateExpiry(dto.expiry),
      userId,
    });

    await this.apiKeyRepo.save(newApiKey);

    return {
      api_key: rawKey,
      expires_at: expiresAt,
      permissions: newApiKey.permissions,
    };
  }

  async revokeApiKey(keyId: string, userId: string) {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.revoked = true;
    await this.apiKeyRepo.save(apiKey);

    return { message: 'API key revoked successfully' };
  }

  async listApiKeys(userId: string) {
    const keys = await this.apiKeyRepo.find({
      where: { userId },
      select: ['id', 'name', 'expiresAt', 'revoked', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return { apiKeys: keys };
  }

   async validateApiKey(rawKey: string): Promise<{ apiKey: ApiKey; permissions: string[] } | null> {
    const allKeys = await this.apiKeyRepo.find({
      relations: ['user'],
    });

    for (const apiKey of allKeys) {
      const isMatch = await bcrypt.compare(rawKey, apiKey.key);

      if (isMatch) {
        if (apiKey.revoked) {
          return null;
        }

        if (new Date() > apiKey.expiresAt) {
          return null;
        }

        return {
          apiKey,
          permissions: apiKey.permissions,
        };
      }
    }

    return null;
  }

}

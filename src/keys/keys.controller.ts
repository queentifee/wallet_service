import { Controller, Post, Body, UseGuards, Req, Get, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { KeysService } from './keys.service';
import { CreateKeyDto } from './dto/create-key.dto';
import { RolloverKeyDto } from './dto/rollover-key.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('API Keys')
@ApiBearerAuth('JWT-auth')
@Controller('keys')
@UseGuards(JwtAuthGuard)

export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Post('create')
   @ApiOperation({ 
    summary: 'Create new API key',
    description: 'Generate a new API key with specific permissions and expiry. Maximum 5 active keys per user.'
  })
  @ApiBody({
    schema: {
      example: {
        name: 'wallet-service',
        permissions: ['deposit', 'transfer', 'read'],
        expiry: '1D'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'API key created successfully',
    schema: {
      example: {
        api_key: 'sk_live_abc123...',
        expires_at: '2025-12-11T00:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Maximum 5 active API keys allowed per user' })
  @ApiResponse({ status: 400, description: 'Invalid permissions or expiry format' })
  async createApiKey(@Req() req, @Body() dto: CreateKeyDto) {
        return this.keysService.createApiKey(req.user.id, dto);

  }

  @Post('rollover')
   @ApiOperation({ 
    summary: 'Rollover expired API key',
    description: 'Create new API key with same permissions as an expired key'
  })
  @ApiBody({
    schema: {
      example: {
        expired_key_id: 'uuid-of-expired-key',
        expiry: '1M'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'New API key created with same permissions',
    schema: {
      example: {
        api_key: 'sk_live_new_key...',
        expires_at: '2026-01-10T00:00:00Z',
        permissions: ['deposit', 'transfer', 'read']
      }
    }
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 400, description: 'Key must be expired to rollover' })
  async rolloverApiKey(@Req() req, @Body() dto: RolloverKeyDto) {
    const key = await this.keysService.rolloverApiKey(req.user.id, dto);
    return { api_key: key, expires_at: key.expires_at };
  }

  @Delete(':id/revoke')
  async revoke(@Param('id') id: string, @Req() req) {
    return this.keysService.revokeApiKey(id, req.user.id);
  }

  @Get()
  async listApiKeys(@Req() req) {
       return this.keysService.listApiKeys(req.user.id);

  }


}

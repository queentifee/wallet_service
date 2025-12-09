import { Controller, Post, Body, UseGuards, Req, Get, Param, Delete } from '@nestjs/common';
import { KeysService } from './keys.service';
import { CreateKeyDto } from './dto/create-key.dto';
import { RolloverKeyDto } from './dto/rollover-key.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';


@Controller('keys')
@UseGuards(JwtAuthGuard)

export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Post('create')
  async createApiKey(@Req() req, @Body() dto: CreateKeyDto) {
        return this.keysService.createApiKey(req.user.id, dto);

  }

  @Post('rollover')
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

import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers, HttpCode } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FlexibleAuthGuard } from 'src/guards/flexible-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from 'src/decorators/permissions.decorator';


@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}


  @Post('deposit')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('deposit')
  async deposit(@Body() body: { amount: number }, @Req() req) {
    return this.walletService.initializeDeposit(req.user.id, body.amount);
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  async paystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.walletService.handleWebhook(payload, signature);
    return { status: true };
  }

  @Get('deposit/:reference/status')
  @UseGuards(FlexibleAuthGuard)
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('read')
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.id);
  }

   @Post('transfer')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('transfer')
  async transfer(
    @Body() body: { wallet_number: string; amount: number },
    @Req() req,
  ) {
    return this.walletService.transfer(req.user.id, body.wallet_number, body.amount);
  }

  @Get('transactions')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('read')
  async getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }

}

import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { FlexibleAuthGuard } from 'src/guards/flexible-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permissions } from 'src/decorators/permissions.decorator';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}


  @Post('deposit')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('deposit')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Initiate Paystack deposit',
    description: 'Initialize a deposit transaction and get Paystack payment link. Requires JWT or API key with "deposit" permission.'
  })
  @ApiBody({
    schema: {
      example: { amount: 5000 }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Deposit initialized successfully',
    schema: {
      example: {
        reference: 'TXN_abc123...',
        authorization_url: 'https://checkout.paystack.com/abc123'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid amount or minimum deposit not met' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired credentials' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing deposit permission' })
  async deposit(@Body() body: { amount: number }, @Req() req) {
    return this.walletService.initializeDeposit(req.user.id, body.amount);
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Paystack webhook endpoint',
    description: 'Receives payment notifications from Paystack. Validates signature and credits wallet.'
  })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'Paystack webhook signature for verification',
    required: true
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async paystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.walletService.handleWebhook(payload, signature);
    return { status: true };
  }

  @Get('deposit/:reference/status')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Check deposit status',
    description: 'Get the current status of a deposit transaction by reference'
  })
  @ApiParam({
    name: 'reference',
    description: 'Transaction reference',
    example: 'TXN_abc123...'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit status retrieved',
    schema: {
      example: {
        reference: 'TXN_abc123...',
        status: 'success',
        amount: 5000
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('read')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Get wallet balance',
    description: 'Retrieve current wallet balance. Requires JWT or API key with "read" permission.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Balance retrieved successfully',
    schema: {
      example: { balance: 15000 }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing read permission' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.id);
  }

   @Post('transfer')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('transfer')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Transfer money to another wallet',
    description: 'Transfer funds from your wallet to another user. Requires JWT or API key with "transfer" permission.'
  })
  @ApiBody({
    schema: {
      example: {
        wallet_number: '9876543210987',
        amount: 3000
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Transfer completed successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Transfer completed'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid amount' })
  @ApiResponse({ status: 404, description: 'Recipient wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing transfer permission' })
  async transfer(
    @Body() body: { wallet_number: string; amount: number },
    @Req() req,
  ) {
    return this.walletService.transfer(req.user.id, body.wallet_number, body.amount);
  }

  @Get('transactions')
  @UseGuards(FlexibleAuthGuard, PermissionGuard)
  @Permissions('read')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ 
    summary: 'Get transaction history',
    description: 'Retrieve all transactions for your wallet. Requires JWT or API key with "read" permission.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction history retrieved',
    schema: {
      example: [
        {
          type: 'deposit',
          amount: 5000,
          status: 'success',
          reference: 'TXN_abc123...',
          createdAt: '2025-12-10T10:00:00Z'
        },
        {
          type: 'transfer_out',
          amount: 3000,
          status: 'success',
          reference: 'TXN_xyz789...',
          recipientWalletNumber: '9876543210987',
          createdAt: '2025-12-10T11:00:00Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing read permission' })
  async getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }

}

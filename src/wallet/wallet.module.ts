import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { User } from 'src/entities/user.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FlexibleAuthGuard } from 'src/guards/flexible-auth.guard';
import { KeysModule } from 'src/keys/keys.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, User]),
    KeysModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jwt_secret_key',
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, FlexibleAuthGuard],
})
export class WalletModule {}

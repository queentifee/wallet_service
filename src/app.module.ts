import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { KeysModule } from './keys/keys.module';
import { WalletModule } from './wallet/wallet.module';
import { User } from './entities/user.entity';
import { ApiKey } from './entities/api-key.entity';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
   imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // host: process.env.DB_HOST || 'localhost',
      // port: Number(process.env.DATABASE_PORT) || 5432,
      // username: process.env.DB_USER || 'postgres',
      // password: process.env.DB_PASSWORD || 'postgres',
      // database: process.env.DB_NAME || 'wallet_system',
        url: process.env.DATABASE_URL, // Single connection string
      entities: [User, ApiKey, Wallet, Transaction],
  synchronize: true, 
 ssl: {
    rejectUnauthorized: false, // Always use SSL on Render
  },
    }),
    AuthModule,
    KeysModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

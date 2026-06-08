import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { ApiKey } from './entities/api-key.entity';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';

dotenv.config();

export const AppDataSource = new DataSource ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, ApiKey, Transaction, Wallet],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    schema: 'public',       
})
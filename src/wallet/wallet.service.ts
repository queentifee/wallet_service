import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { ConfigService } from '@nestjs/config';
import { Transaction, TransactionType, TransactionStatus } from 'src/entities/transaction.entity';
import * as crypto from 'crypto';
import axios from 'axios';
import { User } from 'src/entities/user.entity';



@Injectable()
export class WalletService {
  private paystackBaseUrl = 'https://api.paystack.co';
    constructor (
        @InjectRepository(Wallet)
        private walletRepository: Repository<Wallet>,

        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
       private configService: ConfigService,
      private dataSource: DataSource,

        @InjectRepository(User)
        private userRepository: Repository<User>,

    ) {

    }
private generateReference(): string {
    return 'TXN_' + crypto.randomBytes(16).toString('hex');
  }
    async initializeDeposit( userId: string, amount: number) {
        if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
        if (amount < 100) {
      throw new BadRequestException('Minimum deposit is ₦100');
    }

const wallet = await this.walletRepository.findOne({
    where: { user: { id: userId } },
    relations: ['user'], 
  });
          if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }

        const reference = this.generateReference();

        const transaction = this.transactionRepository.create({
            wallet,
            type: TransactionType.DEPOSIT,
            amount,
            status: TransactionStatus.PENDING,
            reference,
        });
        await this.transactionRepository.save(transaction);

        try {
            const response = await axios.post (
                `${this.paystackBaseUrl}/transaction/initialize`,
                {
                    email: wallet.user?.email || '',
                    amount: amount * 100, 
                    reference,
                }, 
                {
                    headers: {
                     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
             return {
        reference,
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
      };
    } catch (error) {
  console.log('PAYSTACK ERROR:', error.response?.data);

  throw new BadRequestException({
    message: error.response?.data?.message || 'Failed to initialize payment',
    details: error.response?.data,
  });

    }
}

  async handleWebhook(payload: any, signature: string): Promise<boolean> {

  const secret = process.env.PAYSTACK_SECRET_KEY || "PAYSTACK_SECRET_KEY";

  // Verify signature
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (hash !== signature) {
    throw new BadRequestException('Invalid signature');
  }

  const { event, data } = payload;

  if (event === 'charge.success') {
    const reference = data.reference;
    const amount = data.amount / 100; // Paystack sends kobo

    // Find transaction
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
      relations: ['wallet'],
    });

     if (!transaction) {
        console.warn(`Webhook received for unknown reference: ${reference}`);
        return true; 
      }

    // Prevent double-processing
    if (transaction.status === TransactionStatus.SUCCESS) {
                console.log(`Transaction ${reference} already processed. Ignoring webhook.`);
      return true;
    }

    await this.dataSource.transaction(async (manager) => {

      transaction.status = TransactionStatus.SUCCESS;
      await manager.save(transaction);

      transaction.wallet.balance =
        Number(transaction.wallet.balance) + Number(amount);

      await manager.save(transaction.wallet);
    });
  }

  return true;
}

async getDepositStatus(reference: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference, type: TransactionType.DEPOSIT },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } },     relations: ['user'], 
 });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: Number(wallet.balance),
    };
  }

  async transfer(userId: string, recipientWalletNumber: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    // Get sender wallet
    const senderWallet = await this.walletRepository.findOne({ where: { userId } });
    if (!senderWallet) {
      throw new NotFoundException('Your wallet not found');
    }

    // Check balance
    if (Number(senderWallet.balance) < amount) {
throw new BadRequestException(
        `Insufficient balance. Available: ₦${senderWallet.balance}, Required: ₦${amount}`
      );
        }

    // Get recipient wallet
    const recipientWallet = await this.walletRepository.findOne({
      where: { walletNumber: recipientWalletNumber },
    });
    if (!recipientWallet) {
      throw new NotFoundException('Recipient wallet not found');
    }

    // Cannot transfer to self
    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // Perform atomic transfer
    await this.dataSource.transaction(async (manager) => {
      // Deduct from sender
      senderWallet.balance = Number(senderWallet.balance) - amount;
      await manager.save(senderWallet);

      // Add to recipient
      recipientWallet.balance = Number(recipientWallet.balance) + amount;
      await manager.save(recipientWallet);

      // Record sender transaction
      const senderTxn = this.transactionRepository.create({
        reference: this.generateReference(),
        type: TransactionType.TRANSFER_OUT,
        amount,
        status: TransactionStatus.SUCCESS,
        walletId: senderWallet.id,
        recipientWalletNumber,
      });
      await manager.save(senderTxn);

      // Record recipient transaction
      const recipientTxn = this.transactionRepository.create({
        reference: this.generateReference(),
        type: TransactionType.TRANSFER_IN,
        amount,
        status: TransactionStatus.SUCCESS,
        walletId: recipientWallet.id,
        senderWalletNumber: senderWallet.walletNumber,
      });
      await manager.save(recipientTxn);
    });

    return {
      status: 'success',
      message: 'Transfer completed',
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });

    return transactions.map((txn) => ({
      type: txn.type,
      amount: Number(txn.amount),
      status: txn.status,
      reference: txn.reference,
      createdAt: txn.createdAt,
      ...(txn.recipientWalletNumber && { recipientWalletNumber: txn.recipientWalletNumber }),
      ...(txn.senderWalletNumber && { senderWalletNumber: txn.senderWalletNumber }),
    }));
  }

}


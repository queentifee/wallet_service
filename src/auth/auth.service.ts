import { Injectable } from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';


@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Wallet)
        private walletRepository: Repository<Wallet>,
    ) {}

    private generateWalletNumber() {
  const prefix = '456'; // optional, to identify your system
  const random = Math.floor(1000000000 + Math.random() * 9000000000); 
  return prefix + random.toString();
}

    async validateGoogleUser(profile: any) {
  const { id: googleId, email, firstName, lastName, picture } = profile;

  let user = await this.userRepository.findOne({
    where: { email },
    relations: ['wallet'], 
  });

  if (!user) {
    // Create user
    user = this.userRepository.create({
      email,
      firstName,
      lastName,
      picture,
      googleId,
    });

    user = await this.userRepository.save(user);

    // Create wallet
    const wallet = this.walletRepository.create({
      user,
      balance: 0,
      walletNumber: this.generateWalletNumber(),
    });

    await this.walletRepository.save(wallet);

    user.wallet = wallet;
  }

  // Ensure wallet exists even for existing users
  if (!user.wallet) {
    const wallet = this.walletRepository.create({
      user,
      balance: 0,
      walletNumber: this.generateWalletNumber(),
    });
    await this.walletRepository.save(wallet);
    user.wallet = wallet;
  }

  return user;
}


    generateJwt(user: User) {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
        })
    }
}
 


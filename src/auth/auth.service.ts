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
        const { email, firstName, lastName, picture } = profile;

        let user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            user = this.userRepository.create({
                email,
                firstName,
                lastName,
                picture,
            });
       user = await this.userRepository.save(user);

        const wallet = this.walletRepository.create({
      user,
      balance: 0,
      walletNumber: this.generateWalletNumber(), 
    });

    await this.walletRepository.save(wallet);
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
 


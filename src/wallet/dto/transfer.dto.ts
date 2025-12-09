import { IsNumber, Min, IsString } from 'class-validator';

export class TransferDto {
  @IsString()
  walletNumber: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

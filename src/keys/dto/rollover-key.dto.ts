import { IsString, IsIn } from 'class-validator';

export class RolloverKeyDto {
  @IsString()
  expiredKeyId: string;

  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}

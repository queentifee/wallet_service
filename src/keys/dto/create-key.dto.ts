import { IsString, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class CreateKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['deposit', 'transfer', 'read'], { each: true })
  permissions: string[];

  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string; 
}

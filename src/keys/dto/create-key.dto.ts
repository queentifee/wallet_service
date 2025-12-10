import { IsString, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKeyDto {
  @ApiProperty({
    description: 'Name/label for the API key',
    example: 'wallet-service',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Array of permissions granted to this key',
    example: ['deposit', 'transfer', 'read'],
    enum: ['deposit', 'transfer', 'read'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['deposit', 'transfer', 'read'], { each: true })
  permissions: string[];

  @ApiProperty({
    description: 'Expiry duration: 1H (hour), 1D (day), 1M (month), 1Y (year)',
    example: '1D',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string; 
}

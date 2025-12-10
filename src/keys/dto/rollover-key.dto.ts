import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class RolloverKeyDto {
  @ApiProperty({
    description: 'UUID of the expired API key to rollover',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  expiredKeyId: string;
  
@ApiProperty({
    description: 'Expiry duration for the new key',
    example: '1M',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}

import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { access } from 'fs';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Initiate Google OAuth sign-in',
    description: 'Redirects user to Google sign-in page'
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Initiates Google OAuth
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Google OAuth callback',
    description: 'Handles Google OAuth callback and returns JWT token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully authenticated',
    schema: {
      example: {
        message: 'Login successful',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John Doe',
          walletNumber: '1234567890123'
        }
      }
    }
  })
  async googleCallback(@Req() req) {
    const user = await this.authService.validateGoogleUser(req.user);
    const token = this.authService.generateJwt(user);

   return {
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      googleId: user.googleId,
      walletNumber: user.wallet?.walletNumber,
      walletBalance: user.wallet?.balance,
    },
  };
  
  }
}
